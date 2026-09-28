(function () {

  'use strict';


  /* ========================================================
     APPU.UK MP3 PLAYER
     INDEXEDDB PERSISTENCE LAYER
     ======================================================== */

  if (
    window.__appuMp3IndexedDBLayer
  ) {
    return;
  }

  window.__appuMp3IndexedDBLayer = true;


  /* ========================================================
     CONFIG
     ======================================================== */

  var DB_NAME =
    'appu-mp3-player-storage';

  var DB_VERSION =
    1;

  var STORE_NAME =
    'tracks';

  var root = null;

  var fileInput = null;

  var dropzone = null;

  var playlist = null;

  var statusElement = null;

  var db = null;

  var restoring =
    false;

  var initialized =
    false;

  var pendingScanMin =
    0;

  var pendingScanMax =
    0;

  var savedRecords = [];



  /* ========================================================
     HELPERS
     ======================================================== */

  function getElements() {

    root =
      document.getElementById(
        'appu-music-player'
      );

    fileInput =
      document.getElementById(
        'appu-mp3-file-input'
      );

    dropzone =
      document.getElementById(
        'appu-mp3-dropzone'
      );

    playlist =
      document.getElementById(
        'appu-mp3-playlist'
      );

    statusElement =
      document.getElementById(
        'appu-mp3-status'
      );

    return !!(
      root &&
      fileInput &&
      playlist
    );

  }


  function setStatus(
    message
  ) {

    if (!statusElement) {
      return;
    }

    statusElement.textContent =
      message;

  }


  function getExtension(
    name
  ) {

    var match =
      String(
        name || ''
      )
        .toLowerCase()
        .match(
          /\.([a-z0-9]+)$/
        );

    return match
      ? match[1]
      : '';

  }


  function isAudioFile(
    file
  ) {

    if (!file) {
      return false;
    }

    if (
      file.type &&
      file.type.indexOf(
        'audio/'
      ) === 0
    ) {

      return true;

    }

    return [
      'mp3',
      'wav',
      'ogg',
      'oga',
      'm4a',
      'aac',
      'flac',
      'opus'
    ].indexOf(
      getExtension(
        file.name
      )
    ) !== -1;

  }


  function createFingerprint(
    file
  ) {

    return [
      file.name || '',
      file.size || 0,
      file.lastModified || 0
    ].join(
      '::'
    );

  }


  function createFileFromRecord(
    record
  ) {

    try {

      return new File(
        [
          record.file
        ],
        record.name,
        {
          type:
            record.type ||
            record.file.type ||
            'audio/mpeg',

          lastModified:
            record.lastModified ||
            Date.now()
        }
      );

    } catch (
      error
    ) {

      return new Blob(
        [
          record.file
        ],
        {
          type:
            record.type ||
            record.file.type ||
            'audio/mpeg'
        }
      );

    }

  }



  /* ========================================================
     INDEXEDDB
     ======================================================== */

  function openDatabase() {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        if (
          !window.indexedDB
        ) {

          reject(
            new Error(
              'IndexedDB is not supported.'
            )
          );

          return;

        }

        var request =
          indexedDB.open(
            DB_NAME,
            DB_VERSION
          );

        request.onupgradeneeded =
          function (
            event
          ) {

            var database =
              event.target.result;

            if (
              !database.objectStoreNames.contains(
                STORE_NAME
              )
            ) {

              var store =
                database.createObjectStore(
                  STORE_NAME,
                  {
                    keyPath: 'id',
                    autoIncrement: true
                  }
                );

              store.createIndex(
                'fingerprint',
                'fingerprint',
                {
                  unique: true
                }
              );

              store.createIndex(
                'addedAt',
                'addedAt',
                {
                  unique: false
                }
              );

            }

          };

        request.onsuccess =
          function () {

            db =
              request.result;

            db.onversionchange =
              function () {

                db.close();

              };

            resolve(
              db
            );

          };

        request.onerror =
          function () {

            reject(
              request.error ||
              new Error(
                'Unable to open IndexedDB.'
              )
            );

          };

        request.onblocked =
          function () {

            reject(
              new Error(
                'IndexedDB is blocked.'
              )
            );

          };

      }
    );

  }


  function getAllRecords() {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        if (!db) {

          reject(
            new Error(
              'Database is not open.'
            )
          );

          return;

        }

        var transaction =
          db.transaction(
            STORE_NAME,
            'readonly'
          );

        var store =
          transaction.objectStore(
            STORE_NAME
          );

        var request =
          store.getAll();

        request.onsuccess =
          function () {

            var records =
              request.result || [];

            records.sort(
              function (
                a,
                b
              ) {

                return (
                  Number(
                    a.id || 0
                  ) -
                  Number(
                    b.id || 0
                  )
                );

              }
            );

            resolve(
              records
            );

          };

        request.onerror =
          function () {

            reject(
              request.error ||
              new Error(
                'Unable to read saved music.'
              )
            );

          };

      }
    );

  }


  function findRecordByFingerprint(
    fingerprint
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        if (!db) {

          reject(
            new Error(
              'Database is not open.'
            )
          );

          return;

        }

        var transaction =
          db.transaction(
            STORE_NAME,
            'readonly'
          );

        var store =
          transaction.objectStore(
            STORE_NAME
          );

        var index =
          store.index(
            'fingerprint'
          );

        var request =
          index.get(
            fingerprint
          );

        request.onsuccess =
          function () {

            resolve(
              request.result ||
              null
            );

          };

        request.onerror =
          function () {

            reject(
              request.error ||
              new Error(
                'Unable to check saved music.'
              )
            );

          };

      }
    );

  }


  function saveFile(
    file
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        if (!db || !file) {

          resolve(
            false
          );

          return;

        }

        var fingerprint =
          createFingerprint(
            file
          );

        var transaction =
          db.transaction(
            STORE_NAME,
            'readwrite'
          );

        var store =
          transaction.objectStore(
            STORE_NAME
          );

        var request =
          store.put(
            {
              fingerprint:
                fingerprint,

              name:
                file.name || 'Unknown',

              type:
                file.type ||
                'audio/mpeg',

              size:
                file.size || 0,

              lastModified:
                file.lastModified || 0,

              addedAt:
                Date.now(),

              file:
                file
            }
          );

        request.onsuccess =
          function () {

            resolve(
              true
            );

          };

        request.onerror =
          function () {

            if (
              request.error &&
              request.error.name ===
                'ConstraintError'
            ) {

              resolve(
                false
              );

              return;

            }

            reject(
              request.error ||
              new Error(
                'Unable to save music.'
              )
            );

          };

      }
    );

  }


  function deleteRecordById(
    id
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        if (!db || id == null) {

          resolve();

          return;

        }

        var transaction =
          db.transaction(
            STORE_NAME,
            'readwrite'
          );

        var store =
          transaction.objectStore(
            STORE_NAME
          );

        var request =
          store.delete(
            id
          );

        request.onsuccess =
          function () {

            resolve();

          };

        request.onerror =
          function () {

            reject(
              request.error ||
              new Error(
                'Unable to delete saved music.'
              )
            );

          };

      }
    );

  }


  function deleteRecordByFingerprint(
    fingerprint
  ) {

    return findRecordByFingerprint(
      fingerprint
    )
      .then(
        function (
          record
        ) {

          if (!record) {
            return;
          }

          return deleteRecordById(
            record.id
          );

        }
      );

  }



  /* ========================================================
     STORAGE PERSISTENCE
     ======================================================== */

  function requestPersistentStorage() {

    if (
      !navigator.storage ||
      !navigator.storage.persist
    ) {

      return;

    }

    try {

      navigator.storage.persist()
        .catch(
          function () {}
        );

    } catch (
      error
    ) {}

  }



  /* ========================================================
     SAVE NORMAL FILE SELECTION
     ======================================================== */

  function saveFiles(
    fileList
  ) {

    if (
      !fileList ||
      !fileList.length
    ) {

      return Promise.resolve();

    }

    var jobs = [];

    for (
      var i = 0;
      i < fileList.length;
      i++
    ) {

      var file =
        fileList[i];

      if (
        !isAudioFile(
          file
        )
      ) {

        continue;

      }

      jobs.push(
        saveFile(
          file
        )
      );

    }

    return Promise.all(
      jobs
    )
      .then(
        function () {

          return refreshSavedRecords();

        }
      )
      .then(
        function () {

          requestPersistentStorage();

        }
      );

  }



  /* ========================================================
     DURATION SCAN
     ======================================================== */

  function inspectDuration(
    file
  ) {

    return new Promise(
      function (
        resolve
      ) {

        var probe =
          document.createElement(
            'audio'
          );

        var url =
          URL.createObjectURL(
            file
          );

        var finished =
          false;

        function finish(
          seconds
        ) {

          if (finished) {
            return;
          }

          finished =
            true;

          URL.revokeObjectURL(
            url
          );

          probe.removeAttribute(
            'src'
          );

          probe.load();

          resolve(
            Number(
              seconds
            ) || 0
          );

        }

        probe.preload =
          'metadata';

        probe.onloadedmetadata =
          function () {

            finish(
              probe.duration
            );

          };

        probe.onerror =
          function () {

            finish(
              0
            );

          };

        probe.src =
          url;

      }
    );

  }


  function saveScannedFiles(
    fileList,
    minSeconds,
    maxSeconds
  ) {

    var files = [];

    for (
      var i = 0;
      i < fileList.length;
      i++
    ) {

      if (
        isAudioFile(
          fileList[i]
        )
      ) {

        files.push(
          fileList[i]
        );

      }

    }

    if (!files.length) {
      return;
    }

    var accepted =
      [];

    var checks =
      [];

    for (
      var j = 0;
      j < files.length;
      j++
    ) {

      (function (
        file
      ) {

        checks.push(
          inspectDuration(
            file
          )
            .then(
              function (
                seconds
              ) {

                var valid =
                  true;

                if (
                  minSeconds > 0 &&
                  seconds <= minSeconds
                ) {

                  valid =
                    false;

                }

                if (
                  maxSeconds > 0 &&
                  seconds >= maxSeconds
                ) {

                  valid =
                    false;

                }

                if (valid) {

                  accepted.push(
                    file
                  );

                }

              }
            )
        );

      })(
        files[j]
      );

    }

    Promise.all(
      checks
    )
      .then(
        function () {

          return saveFiles(
            accepted
          );

        }
      );

  }



  /* ========================================================
     SCAN OPTION TRACKING
     ======================================================== */

  function initScanTracking() {

    var options =
      document.querySelectorAll(
        '.appu-mp3-scan-option'
      );

    for (
      var i = 0;
      i < options.length;
      i++
    ) {

      options[i].addEventListener(
        'click',
        function () {

          pendingScanMin =
            Number(
              this.getAttribute(
                'data-scan-min'
              )
            ) || 0;

          pendingScanMax =
            Number(
              this.getAttribute(
                'data-scan-max'
              )
            ) || 0;

        }
      );

    }

  }



  /* ========================================================
     FILE INPUT INTERCEPT
     ======================================================== */

  function initFileInput() {

    if (!fileInput) {
      return;
    }

    fileInput.addEventListener(
      'change',
      function () {

        if (restoring) {
          return;
        }

        if (
          !fileInput.files ||
          !fileInput.files.length
        ) {

          return;

        }

        var files =
          [];

        for (
          var i = 0;
          i < fileInput.files.length;
          i++
        ) {

          files.push(
            fileInput.files[i]
          );

        }

        if (
          pendingScanMin === 0 &&
          pendingScanMax === 0
        ) {

          saveFiles(
            files
          );

        } else {

          saveScannedFiles(
            files,
            pendingScanMin,
            pendingScanMax
          );

        }

        pendingScanMin =
          0;

        pendingScanMax =
          0;

      }
    );

  }



  /* ========================================================
     DRAG & DROP INTERCEPT
     ======================================================== */

  function initDropzone() {

    if (!dropzone) {
      return;
    }

    dropzone.addEventListener(
      'drop',
      function (
        event
      ) {

        if (restoring) {
          return;
        }

        if (
          !event.dataTransfer ||
          !event.dataTransfer.files
        ) {

          return;

        }

        saveFiles(
          event.dataTransfer.files
        );

      },
      true
    );

  }



  /* ========================================================
     RESTORE FILES
     ======================================================== */

  function createRestoredFileList(
    records
  ) {

    if (
      typeof DataTransfer !==
      'function'
    ) {

      return null;

    }

    var transfer =
      new DataTransfer();

    for (
      var i = 0;
      i < records.length;
      i++
    ) {

      var record =
        records[i];

      if (
        !record ||
        !record.file
      ) {

        continue;

      }

      var file =
        createFileFromRecord(
          record
        );

      try {

        transfer.items.add(
          file
        );

      } catch (
        error
      ) {}

    }

    return transfer.files;

  }


  function restoreSavedFiles() {

    return getAllRecords()
      .then(
        function (
          records
        ) {

          savedRecords =
            records || [];

          if (
            !savedRecords.length
          ) {

            return;

          }

          if (
            !fileInput
          ) {

            return;

          }

          var restoredFiles =
            createRestoredFileList(
              savedRecords
            );

          if (
            !restoredFiles ||
            !restoredFiles.length
          ) {

            setStatus(
              savedRecords.length +
              (
                savedRecords.length === 1
                  ? ' saved song found. Select it again to restore.'
                  : ' saved songs found. Select them again to restore.'
              )
            );

            return;

          }

          restoring =
            true;

          try {

            fileInput.files =
              restoredFiles;

          } catch (
            error
          ) {

            restoring =
              false;

            setStatus(
              'Saved music was found, but this browser cannot restore the file list automatically.'
            );

            return;

          }

          var changeEvent;

          try {

            changeEvent =
              new Event(
                'change',
                {
                  bubbles: true
                }
              );

          } catch (
            error
          ) {

            changeEvent =
              document.createEvent(
                'Event'
              );

            changeEvent.initEvent(
              'change',
              true,
              true
            );

          }

          fileInput.dispatchEvent(
            changeEvent
          );

          fileInput.value =
            '';

          restoring =
            false;

          setStatus(
            savedRecords.length +
            (
              savedRecords.length === 1
                ? ' saved song restored from this device.'
                : ' saved songs restored from this device.'
            )
          );

        }
      );

  }



  /* ========================================================
     DELETE FROM INDEXEDDB
     ======================================================== */

  function getPlaylistItemIndex(
    item
  ) {

    if (
      !playlist ||
      !item
    ) {

      return -1;

    }

    var children =
      playlist.children;

    for (
      var i = 0;
      i < children.length;
      i++
    ) {

      if (
        children[i] === item
      ) {

        return i;

      }

    }

    return -1;

  }


  function getVisibleTrackName(
    item
  ) {

    if (!item) {
      return '';
    }

    var name =
      item.querySelector(
        '.appu-mp3-item-name'
      );

    if (!name) {
      return '';
    }

    return String(
      name.textContent || ''
    ).trim();

  }


  function cleanFileName(
    name
  ) {

    if (!name) {
      return 'Unknown song';
    }

    return String(name)
      .replace(
        /\.[^/.]+$/,
        ''
      )
      .replace(
        /[_]+/g,
        ' '
      )
      .replace(
        /[-]+/g,
        ' - '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  }


  function findRecordForRemovedItem(
    item,
    index
  ) {

    var visibleName =
      getVisibleTrackName(
        item
      );

    if (
      visibleName
    ) {

      for (
        var i = 0;
        i < savedRecords.length;
        i++
      ) {

        var record =
          savedRecords[i];

        var cleanName =
          cleanFileName(
            record.name
          );

        if (
          cleanName ===
          visibleName
        ) {

          return record;

        }

      }

    }

    if (
      index >= 0 &&
      index < savedRecords.length
    ) {

      return savedRecords[
        index
      ];

    }

    return null;

  }


  function initDeleteTracking() {

    if (!playlist) {
      return;
    }

    playlist.addEventListener(
      'click',
      function (
        event
      ) {

        var button =
          event.target.closest(
            '.appu-mp3-item-remove'
          );

        if (!button) {
          return;
        }

        var item =
          button.closest(
            '.appu-mp3-item'
          );

        if (!item) {
          return;
        }

        var index =
          getPlaylistItemIndex(
            item
          );

        var record =
          findRecordForRemovedItem(
            item,
            index
          );

        if (!record) {
          return;
        }

        deleteRecordById(
          record.id
        )
          .then(
            function () {

              return refreshSavedRecords();

            }
          )
          .catch(
            function () {}
          );

      },
      true
    );

  }



  /* ========================================================
     REFRESH MEMORY COPY
     ======================================================== */

  function refreshSavedRecords() {

    return getAllRecords()
      .then(
        function (
          records
        ) {

          savedRecords =
            records || [];

          return savedRecords;

        }
      );

  }



  /* ========================================================
     DATABASE ERROR HANDLING
     ======================================================== */

  function handleDatabaseError(
    error
  ) {

    if (!error) {
      return;
    }

    setStatus(
      'Local music persistence is unavailable in this browser.'
    );

  }



  /* ========================================================
     INITIALIZE
     ======================================================== */

  function initialize() {

    if (initialized) {
      return;
    }

    initialized =
      true;

    if (
      !getElements()
    ) {

      return;

    }

    if (
      !window.indexedDB
    ) {

      setStatus(
        'This browser does not support local music storage.'
      );

      return;

    }

    initScanTracking();

    initFileInput();

    initDropzone();

    initDeleteTracking();

    openDatabase()
      .then(
        function () {

          return refreshSavedRecords();

        }
      )
      .then(
        function () {

          requestPersistentStorage();

          return restoreSavedFiles();

        }
      )
      .catch(
        function (
          error
        ) {

          handleDatabaseError(
            error
          );

        }
      );

  }



  /* ========================================================
     BOOT
     ======================================================== */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }


})();
