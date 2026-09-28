(function () {

  'use strict';

  var root =
    document.getElementById(
      'appu-music-player'
    );

  if (!root) {
    return;
  }

  var audio =
    document.getElementById(
      'appu-mp3-audio'
    );

  var fileInput =
    document.getElementById(
      'appu-mp3-file-input'
    );

  var scanButton =
    document.getElementById(
      'appu-mp3-scan'
    );

  var eqButton =
    document.getElementById(
      'appu-mp3-equalizer'
    );

  var barButton =
    document.getElementById(
      'appu-mp3-bar'
    );

  var dropzone =
    document.getElementById(
      'appu-mp3-dropzone'
    );

  var playButton =
    document.getElementById(
      'appu-mp3-play'
    );

  var prevButton =
    document.getElementById(
      'appu-mp3-prev'
    );

  var nextButton =
    document.getElementById(
      'appu-mp3-next'
    );

  var backButton =
    document.getElementById(
      'appu-mp3-back'
    );

  var forwardButton =
    document.getElementById(
      'appu-mp3-forward'
    );

  var progress =
    document.getElementById(
      'appu-mp3-progress'
    );

  var currentTime =
    document.getElementById(
      'appu-mp3-current-time'
    );

  var duration =
    document.getElementById(
      'appu-mp3-duration'
    );

  var volume =
    document.getElementById(
      'appu-mp3-volume'
    );

  var volumeIcon =
    document.getElementById(
      'appu-mp3-volume-icon'
    );

  var shuffleButton =
    document.getElementById(
      'appu-mp3-shuffle'
    );

  var repeatButton =
    document.getElementById(
      'appu-mp3-repeat'
    );

  var playlistElement =
    document.getElementById(
      'appu-mp3-playlist'
    );

  var songList =
    document.getElementById(
      'appu-mp3-song-list'
    );

  var genreList =
    document.getElementById(
      'appu-mp3-genre-list'
    );

  var albumList =
    document.getElementById(
      'appu-mp3-album-list'
    );

  var artistList =
    document.getElementById(
      'appu-mp3-artist-list'
    );

  var trackName =
    document.getElementById(
      'appu-mp3-track-name'
    );

  var trackInfo =
    document.getElementById(
      'appu-mp3-track-info'
    );

  var statusElement =
    document.getElementById(
      'appu-mp3-status'
    );

  var cover =
    document.getElementById(
      'appu-mp3-cover'
    );

  var coverImage =
    document.getElementById(
      'appu-mp3-cover-image'
    );

  var visualizer =
    document.getElementById(
      'appu-mp3-visualizer'
    );

  var canvas =
    document.getElementById(
      'appu-mp3-visualizer-canvas'
    );

  var canvasContext =
    canvas.getContext('2d');

  var libraryTrack =
    document.getElementById(
      'appu-mp3-library-track'
    );

  var libraryViewport =
    document.getElementById(
      'appu-mp3-library-viewport'
    );

  var tabs =
    document.querySelectorAll(
      '#appu-mp3-library-tabs .appu-mp3-tab'
    );

  var scanModal =
    document.getElementById(
      'appu-mp3-scan-modal'
    );

  var eqModal =
    document.getElementById(
      'appu-mp3-eq-modal'
    );

  var themeToggle =
    document.getElementById(
      'appu-mp3-theme-toggle'
    );

  var themeIcon =
    document.getElementById(
      'appu-mp3-theme-icon'
    );

  var tracks = [];

  var currentIndex = -1;

  var currentUrl = '';

  var isShuffle = false;

  var repeatMode = 0;

  var volumeBeforeMute = 1;

  var selectedPanel = 0;

  var scanMin = 0;

  var scanMax = 0;

  var audioContext = null;

  var mediaSource = null;

  var analyser = null;

  var eqFilters = [];

  var visualizerAnimation = null;

  var audioGraphReady = false;

  /*
   * ====================================================
   * INDEXEDDB LOCAL MUSIC LIBRARY
   * ====================================================
   *
   * The selected audio File objects are stored locally
   * in the browser. They are not uploaded to the server.
   *
   */

  var MUSIC_DB_NAME =
    'AppuMP3Player';

  var MUSIC_DB_VERSION =
    1;

  var MUSIC_STORE_NAME =
    'tracks';

  var musicDB =
    null;

  var musicDBReady =
    false;

  var musicDBQueue =
    [];

  function openMusicDatabase() {

    if (
      !('indexedDB' in window)
    ) {

      return;

    }

    var request =
      indexedDB.open(
        MUSIC_DB_NAME,
        MUSIC_DB_VERSION
      );

    request.onupgradeneeded =
      function (event) {

        var database =
          event.target.result;

        if (
          !database.objectStoreNames.contains(
            MUSIC_STORE_NAME
          )
        ) {

          database.createObjectStore(
            MUSIC_STORE_NAME,
            {
              keyPath: 'id'
            }
          );

        }

      };

    request.onsuccess =
      function (event) {

        musicDB =
          event.target.result;

        musicDBReady =
          true;

        musicDB.onversionchange =
          function () {

            musicDB.close();

          };

        while (
          musicDBQueue.length
        ) {

          var queuedTrack =
            musicDBQueue.shift();

          saveTrackToDatabase(
            queuedTrack
          );

        }

        loadTracksFromDatabase();

      };

    request.onerror =
      function () {

        musicDB =
          null;

        musicDBReady =
          false;

      };

  }

  function saveTrackToDatabase(
    track
  ) {

    if (
      !track ||
      !track.file
    ) {

      return;

    }

    if (!musicDBReady || !musicDB) {

      musicDBQueue.push(
        track
      );

      return;

    }

    var record = {

      id:
        track.id,

      file:
        track.file,

      name:
        track.name,

      title:
        track.title || '',

      artist:
        track.artist || '',

      album:
        track.album || '',

      albumArtist:
        track.albumArtist || '',

      genre:
        track.genre || '',

      year:
        track.year || '',

      track:
        track.track || '',

      disc:
        track.disc || '',

      composer:
        track.composer || '',

      comment:
        track.comment || '',

      duration:
        track.duration || 0,

      fileName:
        track.file.name,

      fileType:
        track.file.type || '',

      fileSize:
        track.file.size || 0,

      lastModified:
        track.file.lastModified || 0

    };

    try {

      var transaction =
        musicDB.transaction(
          MUSIC_STORE_NAME,
          'readwrite'
        );

      transaction
        .objectStore(
          MUSIC_STORE_NAME
        )
        .put(record);

    } catch (error) {}

  }

  function deleteTrackFromDatabase(
    id
  ) {

    if (
      !id ||
      !musicDBReady ||
      !musicDB
    ) {

      return;

    }

    try {

      var transaction =
        musicDB.transaction(
          MUSIC_STORE_NAME,
          'readwrite'
        );

      transaction
        .objectStore(
          MUSIC_STORE_NAME
        )
        .delete(id);

    } catch (error) {}

  }

  function loadTracksFromDatabase() {

    if (
      !musicDBReady ||
      !musicDB
    ) {

      return;

    }

    try {

      var transaction =
        musicDB.transaction(
          MUSIC_STORE_NAME,
          'readonly'
        );

      var request =
        transaction
          .objectStore(
            MUSIC_STORE_NAME
          )
          .getAll();

      request.onsuccess =
        function () {

          var records =
            request.result || [];

          if (!records.length) {

            return;

          }

          var restoredTracks =
            [];

          for (
            var i = 0;
            i < records.length;
            i++
          ) {

            var record =
              records[i];

            if (!record.file) {

              continue;

            }

            var restoredTrack = {

              id:
                record.id ||
                (
                  typeof crypto !== 'undefined' &&
                  crypto.randomUUID
                    ? crypto.randomUUID()
                    : String(Date.now()) +
                      '-' +
                      i
                ),

              file:
                record.file,

              name:
                record.name ||
                cleanFileName(
                  record.file.name
                ),

              title:
                record.title || '',

              artist:
                record.artist || '',

              album:
                record.album || '',

              albumArtist:
                record.albumArtist || '',

              genre:
                record.genre || '',

              year:
                record.year || '',

              track:
                record.track || '',

              disc:
                record.disc || '',

              composer:
                record.composer || '',

              comment:
                record.comment || '',

              url:
                null,

              duration:
                Number(
                  record.duration
                ) || 0,

              artworkUrl:
                null,

              artworkType:
                '',

              metadataLoaded:
                false

            };

            restoredTracks.push(
              restoredTrack
            );

          }

          if (!restoredTracks.length) {

            return;

          }

          /*
           * Do not duplicate records if the database
           * becomes ready after files were added.
           */

          for (
            var j = 0;
            j < restoredTracks.length;
            j++
          ) {

            var exists =
              false;

            for (
              var k = 0;
              k < tracks.length;
              k++
            ) {

              if (
                tracks[k].id ===
                restoredTracks[j].id
              ) {

                exists =
                  true;

                break;

              }

            }

            if (!exists) {

              tracks.push(
                restoredTracks[j]
              );

            }

          }

          renderAllLibraries();

          if (
            currentIndex === -1 &&
            tracks.length
          ) {

            loadTrack(
              0,
              false
            );

          }

          setStatus(
            tracks.length +
            (
              tracks.length === 1
                ? ' saved audio file restored.'
                : ' saved audio files restored.'
            )
          );

          enrichTrackQueue(
            restoredTracks,
            0
          );

        };

    } catch (error) {}

  }

  function persistTrackLibrary() {

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      saveTrackToDatabase(
        tracks[i]
      );

    }

  }

  var THEME_STORAGE_KEY =
    'appu-mp3-player-theme';

  var themeToggle =
    document.getElementById(
      'appu-mp3-theme-toggle'
    );

  var themeIcon =
    document.getElementById(
      'appu-mp3-theme-icon'
    );

  var eqBands = [
    60,
    170,
    310,
    600,
    1000,
    3000,
    6000,
    12000,
    14000
  ];

  function applyTheme(theme) {

    if (
      theme !== 'light' &&
      theme !== 'dark'
    ) {

      theme = 'dark';

    }

    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    if (themeIcon) {

      themeIcon.textContent =
        theme === 'dark'
          ? '\u2600\uFE0F'
          : '\uD83C\uDF1B';

    }

    if (themeToggle) {

      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark'
          ? 'Change to light theme'
          : 'Change to dark theme'
      );

      themeToggle.setAttribute(
        'title',
        theme === 'dark'
          ? 'Change to light theme'
          : 'Change to dark theme'
      );

    }

  }

  function loadTheme() {

    var savedTheme = null;

    try {

      savedTheme =
        localStorage.getItem(
          THEME_STORAGE_KEY
        );

    } catch (error) {

      savedTheme = null;

    }

    if (
      savedTheme !== 'light' &&
      savedTheme !== 'dark'
    ) {

      savedTheme = 'dark';

    }

    applyTheme(savedTheme);

  }

  function toggleTheme() {

    var currentTheme =
      document.documentElement.getAttribute(
        'data-theme'
      );

    var newTheme =
      currentTheme === 'dark'
        ? 'light'
        : 'dark';

    applyTheme(newTheme);

    try {

      localStorage.setItem(
        THEME_STORAGE_KEY,
        newTheme
      );

    } catch (error) {}

  }

  if (themeToggle) {

    themeToggle.addEventListener(
      'click',
      toggleTheme
    );

  }

  loadTheme();

  function formatTime(seconds) {

    if (
      !isFinite(seconds) ||
      seconds < 0
    ) {
      return '0:00';
    }

    seconds =
      Math.floor(seconds);

    var minutes =
      Math.floor(
        seconds / 60
      );

    var remaining =
      seconds % 60;

    if (remaining < 10) {
      remaining =
        '0' + remaining;
    }

    return (
      minutes +
      ':' +
      remaining
    );

  }

  function cleanFileName(name) {

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

  function getExtension(name) {

    var match =
      String(name || '')
        .toLowerCase()
        .match(
          /\.([a-z0-9]+)$/
        );

    return match
      ? match[1]
      : '';

  }

  function isAudioFile(file) {

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

  function setStatus(message) {

    statusElement.textContent =
      message || '';

  }

  function openModal(modal) {

    modal.classList.add(
      'appu-open'
    );

    modal.setAttribute(
      'aria-hidden',
      'false'
    );

  }

  function closeModal(modal) {

    modal.classList.remove(
      'appu-open'
    );

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

  }

  function trimText(value) {

    return String(
      value || ''
    )
      .replace(
        /\u0000/g,
        ''
      )
      .replace(
        /^\s+|\s+$/g,
        ''
      );

  }

  function createTrackUrl(
    track
  ) {

    if (!track) {
      return '';
    }

    if (
      track.url
    ) {

      return track.url;

    }

    if (
      !track.file
    ) {

      return '';

    }

    try {

      track.url =
        URL.createObjectURL(
          track.file
        );

      return track.url;

    } catch (error) {

      return '';

    }

  }

  function revokeTrackUrl(
    track
  ) {

    if (
      track &&
      track.url
    ) {

      try {

        URL.revokeObjectURL(
          track.url
        );

      } catch (error) {}

      track.url =
        null;

    }

  }

  function getTrackDisplayTitle(
    track
  ) {

    if (!track) {
      return 'Unknown Song';
    }

    return (
      trimText(
        track.title
      ) ||
      trimText(
        track.name
      ) ||
      'Unknown Song'
    );

  }

  function getTrackDisplayArtist(
    track
  ) {

    if (!track) {
      return 'Unknown Artist';
    }

    return (
      trimText(
        track.artist
      ) ||
      'Unknown Artist'
    );

  }

  function getTrackDisplayAlbum(
    track
  ) {

    if (!track) {
      return 'Unknown Album';
    }

    return (
      trimText(
        track.album
      ) ||
      'Unknown Album'
    );

  }

  function getTrackSearchText(
    track
  ) {

    return [
      track.title,
      track.name,
      track.artist,
      track.album,
      track.albumArtist,
      track.genre,
      track.year,
      track.composer,
      track.comment
    ]
      .join(' ')
      .toLowerCase();

  }

  function setCurrentTrackArtwork(
    track
  ) {

    if (!coverImage) {
      return;
    }

    if (
      track &&
      track.artworkUrl
    ) {

      coverImage.src =
        track.artworkUrl;

      coverImage.style.display =
        'block';

      cover.classList.add(
        'appu-has-artwork'
      );

      return;

    }

    coverImage.removeAttribute(
      'src'
    );

    coverImage.style.display =
      'none';

    cover.classList.remove(
      'appu-has-artwork'
    );

  }

  function revokeTrackArtwork(
    track
  ) {

    if (
      track &&
      track.artworkUrl
    ) {

      try {

        URL.revokeObjectURL(
          track.artworkUrl
        );

      } catch (error) {}

      track.artworkUrl =
        null;

    }

  }

  function decodeSynchsafeInteger(
    bytes
  ) {

    return (
      (
        bytes[0] & 0x7f
      ) * 2097152 +
      (
        bytes[1] & 0x7f
      ) * 16384 +
      (
        bytes[2] & 0x7f
      ) * 128 +
      (
        bytes[3] & 0x7f
      )
    );

  }

  function readUInt32(
    view,
    offset
  ) {

    return view.getUint32(
      offset,
      false
    );

  }

  function readUInt24(
    view,
    offset
  ) {

    return (
      (
        view.getUint8(
          offset
        ) << 16
      ) |
      (
        view.getUint8(
          offset + 1
        ) << 8
      ) |
      view.getUint8(
        offset + 2
      )
    );

  }

  function decodeText(
    bytes,
    encoding
  ) {

    try {

      if (
        typeof TextDecoder ===
        'function'
      ) {

        var decoder;

        if (
          encoding === 1
        ) {

          decoder =
            new TextDecoder(
              'utf-16'
            );

        } else if (
          encoding === 2
        ) {

          decoder =
            new TextDecoder(
              'utf-16be'
            );

        } else {

          decoder =
            new TextDecoder(
              'utf-8'
            );

        }

        return decoder
          .decode(bytes)
          .replace(
            /^\uFEFF/,
            ''
          )
          .replace(
            /\u0000+$/g,
            ''
          )
          .trim();

      }

    } catch (error) {}

    var output =
      '';

    for (
      var i = 0;
      i < bytes.length;
      i++
    ) {

      if (
        bytes[i] !== 0
      ) {

        output +=
          String.fromCharCode(
            bytes[i]
          );

      }

    }

    return output.trim();

  }

  function decodeLatin1(
    bytes
  ) {

    var output =
      '';

    for (
      var i = 0;
      i < bytes.length;
      i++
    ) {

      output +=
        String.fromCharCode(
          bytes[i]
        );

    }

    return output;

  }

  function parseID3TextFrame(
    bytes
  ) {

    if (!bytes || !bytes.length) {
      return '';
    }

    var encoding =
      bytes[0];

    return decodeText(
      bytes.slice(1),
      encoding
    );

  }

  function parseID3CommentFrame(
    bytes
  ) {

    if (
      !bytes ||
      bytes.length < 5
    ) {

      return '';

    }

    var encoding =
      bytes[0];

    var textBytes =
      bytes.slice(4);

    return decodeText(
      textBytes,
      encoding
    );

  }

  function parseID3PictureFrame(
    bytes
  ) {

    if (
      !bytes ||
      bytes.length < 10
    ) {

      return null;

    }

    var encoding =
      bytes[0];

    var position =
      1;

    var pictureType =
      bytes[position];

    position += 1;

    var mimeEnd =
      position;

    while (
      mimeEnd < bytes.length &&
      bytes[mimeEnd] !== 0
    ) {

      mimeEnd++;

    }

    var mimeType =
      decodeLatin1(
        bytes.slice(
          position,
          mimeEnd
        )
      );

    position =
      mimeEnd + 1;

    if (
      encoding === 0
    ) {

      while (
        position < bytes.length &&
        bytes[position] !== 0
      ) {

        position++;

      }

      position += 1;

    } else {

      while (
        position + 1 < bytes.length &&
        !(
          bytes[position] === 0 &&
          bytes[position + 1] === 0
        )
      ) {

        position += 2;

      }

      position += 2;

    }

    position += 1;

    if (
      position >= bytes.length
    ) {

      return null;

    }

    var imageBytes =
      bytes.slice(
        position
      );

    if (!imageBytes.length) {
      return null;
    }

    var blob =
      new Blob(
        [imageBytes],
        {
          type:
            mimeType ||
            'image/jpeg'
        }
      );

    return {
      blob:
        blob,

      mime:
        mimeType ||
        'image/jpeg',

      pictureType:
        pictureType
    };

  }

  function parseID3(
    file
  ) {

    return file.arrayBuffer()
      .then(
        function (buffer) {

          var view =
            new DataView(
              buffer
            );

          if (
            view.byteLength < 10
          ) {

            return {};

          }

          if (
            view.getUint8(0) !== 0x49 ||
            view.getUint8(1) !== 0x44 ||
            view.getUint8(2) !== 0x33
          ) {

            return {};

          }

          var version =
            view.getUint8(3);

          var flags =
            view.getUint8(5);

          var size =
            decodeSynchsafeInteger([
              view.getUint8(6),
              view.getUint8(7),
              view.getUint8(8),
              view.getUint8(9)
            ]);

          var offset =
            10;

          if (
            flags & 0x40
          ) {

            if (
              version === 4
            ) {

              if (
                offset + 4 <=
                view.byteLength
              ) {

                var extSize =
                  decodeSynchsafeInteger([
                    view.getUint8(
                      offset
                    ),
                    view.getUint8(
                      offset + 1
                    ),
                    view.getUint8(
                      offset + 2
                    ),
                    view.getUint8(
                      offset + 3
                    )
                  ]);

                offset +=
                  extSize;

              }

            } else {

              if (
                offset + 4 <=
                view.byteLength
              ) {

                var extSizeV3 =
                  view.getUint32(
                    offset,
                    false
                  );

                offset +=
                  extSizeV3;

              }

            }

          }

          var end =
            Math.min(
              view.byteLength,
              10 + size
            );

          var result = {

            title:
              '',

            artist:
              '',

            album:
              '',

            albumArtist:
              '',

            genre:
              '',

            year:
              '',

            track:
              '',

            disc:
              '',

            composer:
              '',

            comment:
              '',

            artwork:
              null

          };

          while (
            offset < end
          ) {

            if (
              version === 2
            ) {

              if (
                offset + 6 > end
              ) {

                break;

              }

              var id2 =
                String.fromCharCode(
                  view.getUint8(
                    offset
                  ),
                  view.getUint8(
                    offset + 1
                  ),
                  view.getUint8(
                    offset + 2
                  )
                );

              var size2 =
                readUInt24(
                  view,
                  offset + 3
                );

              if (
                !id2.trim() ||
                size2 <= 0
              ) {

                break;

              }

              var data2 =
                new Uint8Array(
                  buffer,
                  offset + 6,
                  Math.min(
                    size2,
                    end -
                    (
                      offset + 6
                    )
                  )
                );

              if (
                id2 === 'TT2'
              ) {

                result.title =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TP1'
              ) {

                result.artist =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TAL'
              ) {

                result.album =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TCO'
              ) {

                result.genre =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TYE'
              ) {

                result.year =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TRK'
              ) {

                result.track =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TPA'
              ) {

                result.disc =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'TCM'
              ) {

                result.composer =
                  parseID3TextFrame(
                    data2
                  );

              } else if (
                id2 === 'COM'
              ) {

                result.comment =
                  parseID3CommentFrame(
                    data2
                  );

              } else if (
                id2 === 'PIC'
              ) {

                result.artwork =
                  parseID3PictureFrame(
                    data2
                  );

              }

              offset +=
                6 +
                size2;

            } else {

              if (
                offset + 10 > end
              ) {

                break;

              }

              var id =
                String.fromCharCode(
                  view.getUint8(
                    offset
                  ),
                  view.getUint8(
                    offset + 1
                  ),
                  view.getUint8(
                    offset + 2
                  ),
                  view.getUint8(
                    offset + 3
                  )
                );

              var frameSize;

              if (
                version === 4
              ) {

                frameSize =
                  decodeSynchsafeInteger([
                    view.getUint8(
                      offset + 4
                    ),
                    view.getUint8(
                      offset + 5
                    ),
                    view.getUint8(
                      offset + 6
                    ),
                    view.getUint8(
                      offset + 7
                    )
                  ]);

              } else {

                frameSize =
                  readUInt32(
                    view,
                    offset + 4
                  );

              }

              if (
                !id.trim() ||
                frameSize <= 0
              ) {

                break;

              }

              var data =
                new Uint8Array(
                  buffer,
                  offset + 10,
                  Math.min(
                    frameSize,
                    end -
                    (
                      offset + 10
                    )
                  )
                );

              if (
                id === 'TIT2'
              ) {

                result.title =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TPE1'
              ) {

                result.artist =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TALB'
              ) {

                result.album =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TPE2'
              ) {

                result.albumArtist =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TCON'
              ) {

                result.genre =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TYER' ||
                id === 'TDRC'
              ) {

                result.year =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TRCK'
              ) {

                result.track =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TPOS'
              ) {

                result.disc =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'TCOM'
              ) {

                result.composer =
                  parseID3TextFrame(
                    data
                  );

              } else if (
                id === 'COMM'
              ) {

                result.comment =
                  parseID3CommentFrame(
                    data
                  );

              } else if (
                id === 'APIC'
              ) {

                result.artwork =
                  parseID3PictureFrame(
                    data
                  );

              }

              offset +=
                10 +
                frameSize;

            }

          }

          return result;

        }
      );

  }

  function enrichTrack(
    track
  ) {

    if (
      !track ||
      !track.file
    ) {

      return Promise.resolve();

    }

    return parseID3(
      track.file
    )
      .then(
        function (metadata) {

          if (
            metadata.title
          ) {

            track.title =
              metadata.title;

          }

          if (
            metadata.artist
          ) {

            track.artist =
              metadata.artist;

          }

          if (
            metadata.album
          ) {

            track.album =
              metadata.album;

          }

          if (
            metadata.albumArtist
          ) {

            track.albumArtist =
              metadata.albumArtist;

          }

          if (
            metadata.genre
          ) {

            track.genre =
              metadata.genre;

          }

          if (
            metadata.year
          ) {

            track.year =
              metadata.year;

          }

          if (
            metadata.track
          ) {

            track.track =
              metadata.track;

          }

          if (
            metadata.disc
          ) {

            track.disc =
              metadata.disc;

          }

          if (
            metadata.composer
          ) {

            track.composer =
              metadata.composer;

          }

          if (
            metadata.comment
          ) {

            track.comment =
              metadata.comment;

          }

          if (
            metadata.artwork
          ) {

            revokeTrackArtwork(
              track
            );

            track.artworkUrl =
              URL.createObjectURL(
                metadata.artwork.blob
              );

            track.artworkType =
              metadata.artwork.mime;

          }

          track.metadataLoaded =
            true;

          saveTrackToDatabase(
            track
          );

          renderAllLibraries();

          if (
            currentIndex >= 0 &&
            tracks[currentIndex] ===
              track
          ) {

            updateTrackDisplay();

            updateMediaSession();

          }

        }
      )
      .catch(
        function () {

          track.metadataLoaded =
            true;

          saveTrackToDatabase(
            track
          );

        }
      );

  }

  function enrichTrackQueue(
    queue,
    index
  ) {

    if (
      !queue ||
      index >= queue.length
    ) {

      return;

    }

    enrichTrack(
      queue[index]
    )
      .then(
        function () {

          enrichTrackQueue(
            queue,
            index + 1
          );

        }
      );

  }

  function getAudioDuration(
    track
  ) {

    return new Promise(
      function (resolve) {

        if (
          !track ||
          !track.file
        ) {

          resolve(0);

          return;

        }

        var url =
          createTrackUrl(
            track
          );

        if (!url) {

          resolve(0);

          return;

        }

        var tempAudio =
          document.createElement(
            'audio'
          );

        tempAudio.preload =
          'metadata';

        tempAudio.onloadedmetadata =
          function () {

            var value =
              isFinite(
                tempAudio.duration
              )
                ? tempAudio.duration
                : 0;

            tempAudio.src =
              '';

            resolve(value);

          };

        tempAudio.onerror =
          function () {

            tempAudio.src =
              '';

            resolve(0);

          };

        tempAudio.src =
          url;

      }
    );

  }

  function updateTrackDuration(
    track
  ) {

    if (
      !track ||
      !track.file
    ) {

      return Promise.resolve();

    }

    if (
      track.duration &&
      isFinite(
        track.duration
      )
    ) {

      return Promise.resolve();

    }

    return getAudioDuration(
      track
    )
      .then(
        function (value) {

          if (
            value > 0
          ) {

            track.duration =
              value;

            saveTrackToDatabase(
              track
            );

            renderAllLibraries();

          }

        }
      );

  }

  function updateTrackDisplay() {

    if (
      currentIndex < 0 ||
      !tracks[currentIndex]
    ) {

      trackName.textContent =
        'No song selected';

      trackInfo.textContent =
        '';

      setCurrentTrackArtwork(
        null
      );

      return;

    }

    var track =
      tracks[currentIndex];

    trackName.textContent =
      getTrackDisplayTitle(
        track
      );

    var infoParts = [];

    if (
      track.artist
    ) {

      infoParts.push(
        track.artist
      );

    }

    if (
      track.album
    ) {

      infoParts.push(
        track.album
      );

    }

    trackInfo.textContent =
      infoParts.join(
        ' • '
      );

    setCurrentTrackArtwork(
      track
    );

  }

  function updatePlayButton() {

    if (!playButton) {
      return;
    }

    var playing =
      !audio.paused;

    playButton.textContent =
      playing
        ? '❚❚'
        : '▶';

    playButton.setAttribute(
      'aria-label',
      playing
        ? 'Pause'
        : 'Play'
    );

    playButton.setAttribute(
      'title',
      playing
        ? 'Pause'
        : 'Play'
    );

  }

  function updateVolumeIcon() {

    if (!volumeIcon) {
      return;
    }

    if (
      audio.muted ||
      audio.volume === 0
    ) {

      volumeIcon.textContent =
        '🔇';

    } else if (
      audio.volume < 0.5
    ) {

      volumeIcon.textContent =
        '🔉';

    } else {

      volumeIcon.textContent =
        '🔊';

    }

  }

  function updateProgress() {

    var current =
      audio.currentTime || 0;

    var total =
      audio.duration || 0;

    currentTime.textContent =
      formatTime(
        current
      );

    duration.textContent =
      formatTime(
        total
      );

    if (
      total > 0
    ) {

      progress.value =
        (
          current /
          total
        ) * 100;

    } else {

      progress.value =
        0;

    }

    updateMediaPosition();

  }

  function updateRepeatButton() {

    if (!repeatButton) {
      return;
    }

    if (
      repeatMode === 0
    ) {

      repeatButton.textContent =
        '↻';

      repeatButton.classList.remove(
        'appu-active'
      );

      repeatButton.setAttribute(
        'aria-label',
        'Repeat off'
      );

      return;

    }

    if (
      repeatMode === 1
    ) {

      repeatButton.textContent =
        '↻';

      repeatButton.classList.add(
        'appu-active'
      );

      repeatButton.setAttribute(
        'aria-label',
        'Repeat all'
      );

      return;

    }

    repeatButton.textContent =
      '🔂';

    repeatButton.classList.add(
      'appu-active'
    );

    repeatButton.setAttribute(
      'aria-label',
      'Repeat one'
    );

  }

  function toggleRepeat() {

    repeatMode++;

    if (
      repeatMode > 2
    ) {

      repeatMode =
        0;

    }

    updateRepeatButton();

  }

  function toggleShuffle() {

    isShuffle =
      !isShuffle;

    shuffleButton.classList.toggle(
      'appu-active',
      isShuffle
    );

    shuffleButton.setAttribute(
      'aria-label',
      isShuffle
        ? 'Shuffle on'
        : 'Shuffle off'
    );

  }

  function getNextIndex() {

    if (
      !tracks.length
    ) {

      return -1;

    }

    if (
      repeatMode === 2 &&
      currentIndex >= 0
    ) {

      return currentIndex;

    }

    if (isShuffle) {

      if (
        tracks.length === 1
      ) {

        return 0;

      }

      var next =
        currentIndex;

      while (
        next === currentIndex
      ) {

        next =
          Math.floor(
            Math.random() *
            tracks.length
          );

      }

      return next;

    }

    if (
      currentIndex < 0
    ) {

      return 0;

    }

    return (
      currentIndex + 1
    ) % tracks.length;

  }

  function getPreviousIndex() {

    if (
      !tracks.length
    ) {

      return -1;

    }

    if (
      repeatMode === 2 &&
      currentIndex >= 0
    ) {

      return currentIndex;

    }

    if (isShuffle) {

      if (
        tracks.length === 1
      ) {

        return 0;

      }

      var previous =
        currentIndex;

      while (
        previous === currentIndex
      ) {

        previous =
          Math.floor(
            Math.random() *
            tracks.length
          );

      }

      return previous;

    }

    if (
      currentIndex < 0
    ) {

      return 0;

    }

    return (
      currentIndex -
      1 +
      tracks.length
    ) % tracks.length;

  }

  function loadTrack(
    index,
    autoplay
  ) {

    if (
      index < 0 ||
      index >= tracks.length
    ) {

      return;

    }

    var track =
      tracks[index];

    var url =
      createTrackUrl(
        track
      );

    if (!url) {

      return;

    }

    if (
      currentIndex !== index
    ) {

      if (
        currentIndex >= 0 &&
        tracks[currentIndex]
      ) {

        revokeTrackUrl(
          tracks[currentIndex]
        );

      }

      currentIndex =
        index;

    }

    audio.src =
      url;

    audio.load();

    updateTrackDisplay();

    updateProgress();

    renderAllLibraries();

    updateMediaSession();

    updateTrackDuration(
      track
    );

    if (
      autoplay
    ) {

      initializeAudioGraph();

      var promise =
        audio.play();

      if (
        promise &&
        typeof promise.catch ===
          'function'
      ) {

        promise.catch(
          function () {

            setStatus(
              'Tap Play to start audio.'
            );

          }
        );

      }

    } else {

      setStatus(
        'Selected: ' +
        getTrackDisplayTitle(
          track
        )
      );

    }

  }

  function togglePlay() {

    if (
      currentIndex < 0 &&
      tracks.length
    ) {

      loadTrack(
        0,
        true
      );

      return;

    }

    if (
      !tracks.length
    ) {

      setStatus(
        'Add an audio file first.'
      );

      return;

    }

    initializeAudioGraph();

    if (
      audio.paused
    ) {

      var promise =
        audio.play();

      if (
        promise &&
        typeof promise.catch ===
          'function'
      ) {

        promise.catch(
          function () {}
        );

      }

    } else {

      audio.pause();

    }

  }

  function previousTrack() {

    var index =
      getPreviousIndex();

    if (
      index >= 0
    ) {

      loadTrack(
        index,
        true
      );

    }

  }

  function nextTrack() {

    var index =
      getNextIndex();

    if (
      index >= 0
    ) {

      loadTrack(
        index,
        true
      );

    }

  }

  function seekBy(
    seconds
  ) {

    if (
      !isFinite(
        audio.duration
      )
    ) {

      return;

    }

    audio.currentTime =
      Math.max(
        0,
        Math.min(
          audio.duration,
          audio.currentTime +
          seconds
        )
      );

  }

  function initializeAudioGraph() {

    if (
      audioGraphReady
    ) {

      if (
        audioContext &&
        audioContext.state ===
          'suspended'
      ) {

        audioContext.resume()
          .catch(
            function () {}
          );

      }

      return;

    }

    var AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    try {

      audioContext =
        new AudioContextClass();

      mediaSource =
        audioContext.createMediaElementSource(
          audio
        );

      analyser =
        audioContext.createAnalyser();

      analyser.fftSize =
        256;

      var frequencies =
        eqBands;

      eqFilters =
        [];

      for (
        var i = 0;
        i < frequencies.length;
        i++
      ) {

        var filter =
          audioContext.createBiquadFilter();

        filter.type =
          'peaking';

        filter.frequency.value =
          frequencies[i];

        filter.Q.value =
          1;

        filter.gain.value =
          0;

        eqFilters.push(
          filter
        );

      }

      var previousNode =
        mediaSource;

      for (
        var j = 0;
        j < eqFilters.length;
        j++
      ) {

        previousNode.connect(
          eqFilters[j]
        );

        previousNode =
          eqFilters[j];

      }

      previousNode.connect(
        analyser
      );

      analyser.connect(
        audioContext.destination
      );

      audioGraphReady =
        true;

      startVisualizer();

      if (
        audioContext.state ===
        'suspended'
      ) {

        audioContext.resume()
          .catch(
            function () {}
          );

      }

    } catch (error) {

      audioContext =
        null;

      mediaSource =
        null;

      analyser =
        null;

      eqFilters =
        [];

      audioGraphReady =
        false;

    }

  }

  function drawVisualizer() {

    if (
      !canvasContext ||
      !canvas ||
      !analyser
    ) {

      return;

    }

    var width =
      canvas.clientWidth ||
      canvas.width;

    var height =
      canvas.clientHeight ||
      canvas.height;

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {

      canvas.width =
        width;

      canvas.height =
        height;

    }

    canvasContext.clearRect(
      0,
      0,
      width,
      height
    );

    var data =
      new Uint8Array(
        analyser.frequencyBinCount
      );

    analyser.getByteFrequencyData(
      data
    );

    var barWidth =
      width /
      data.length;

    for (
      var i = 0;
      i < data.length;
      i++
    ) {

      var value =
        data[i] /
        255;

      var barHeight =
        value *
        height;

      canvasContext.fillRect(
        i * barWidth,
        height -
          barHeight,
        Math.max(
          1,
          barWidth - 1
        ),
        barHeight
      );

    }

    visualizerAnimation =
      requestAnimationFrame(
        drawVisualizer
      );

  }

  function startVisualizer() {

    if (
      visualizerAnimation
    ) {

      cancelAnimationFrame(
        visualizerAnimation
      );

    }

    drawVisualizer();

  }

  function stopVisualizer() {

    if (
      visualizerAnimation
    ) {

      cancelAnimationFrame(
        visualizerAnimation
      );

      visualizerAnimation =
        null;

    }

  }

  function updateEqualizerUI() {

    if (!eqModal) {
      return;
    }

    var sliders =
      eqModal.querySelectorAll(
        '[data-eq-band]'
      );

    for (
      var i = 0;
      i < sliders.length;
      i++
    ) {

      var band =
        Number(
          sliders[i].getAttribute(
            'data-eq-band'
          )
        );

      if (
        eqFilters[band]
      ) {

        sliders[i].value =
          eqFilters[band].gain.value;

      }

    }

  }

  function setEqualizerBand(
    band,
    value
  ) {

    if (
      eqFilters[band]
    ) {

      eqFilters[band].gain.value =
        Number(value) || 0;

    }

  }

  function resetEqualizer() {

    for (
      var i = 0;
      i < eqFilters.length;
      i++
    ) {

      eqFilters[i].gain.value =
        0;

    }

    updateEqualizerUI();

  }

  function renderTrackItem(
    track,
    index
  ) {

    var item =
      document.createElement(
        'div'
      );

    item.className =
      'appu-mp3-track-item';

    if (
      index === currentIndex
    ) {

      item.classList.add(
        'appu-current'
      );

    }

    var title =
      document.createElement(
        'div'
      );

    title.className =
      'appu-mp3-track-title';

    title.textContent =
      getTrackDisplayTitle(
        track
      );

    var artist =
      document.createElement(
        'div'
      );

    artist.className =
      'appu-mp3-track-artist';

    artist.textContent =
      getTrackDisplayArtist(
        track
      );

    var removeButton =
      document.createElement(
        'button'
      );

    removeButton.type =
      'button';

    removeButton.className =
      'appu-mp3-track-remove';

    removeButton.textContent =
      '×';

    removeButton.setAttribute(
      'aria-label',
      'Remove ' +
      getTrackDisplayTitle(
        track
      )
    );

    removeButton.addEventListener(
      'click',
      function (event) {

        event.stopPropagation();

        removeTrack(
          index
        );

      }
    );

    item.appendChild(
      title
    );

    item.appendChild(
      artist
    );

    item.appendChild(
      removeButton
    );

    item.addEventListener(
      'click',
      function () {

        loadTrack(
          index,
          true
        );

      }
    );

    return item;

  }

  function renderPlaylist() {

    playlistElement.innerHTML =
      '';

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      playlistElement.appendChild(
        renderTrackItem(
          tracks[i],
          i
        )
      );

    }

  }

  function removeTrack(
    index
  ) {

    if (
      index < 0 ||
      index >= tracks.length
    ) {

      return;

    }

    var removed =
      tracks[index];

    deleteTrackFromDatabase(
      removed.id
    );

    revokeTrackArtwork(
      removed
    );

    revokeTrackUrl(
      removed
    );

    tracks.splice(
      index,
      1
    );

    if (
      !tracks.length
    ) {

      currentIndex =
        -1;

      audio.removeAttribute(
        'src'
      );

      audio.load();

      updateTrackDisplay();

      updateProgress();

      renderAllLibraries();

      setStatus(
        'Library is empty.'
      );

      return;

    }

    if (
      currentIndex === index
    ) {

      currentIndex =
        Math.min(
          index,
          tracks.length - 1
        );

      loadTrack(
        currentIndex,
        false
      );

    } else if (
      currentIndex > index
    ) {

      currentIndex--;

    }

    renderAllLibraries();

  }

  function addFiles(
    fileList
  ) {

    if (!fileList) {
      return;
    }

    var added =
      0;

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

      var duplicate =
        false;

      for (
        var j = 0;
        j < tracks.length;
        j++
      ) {

        if (
          tracks[j].file &&
          tracks[j].file.name ===
            file.name &&
          tracks[j].file.size ===
            file.size &&
          tracks[j].file.lastModified ===
            file.lastModified
        ) {

          duplicate =
            true;

          break;

        }

      }

      if (duplicate) {

        continue;

      }

      var track = {

        id:
          (
            typeof crypto !== 'undefined' &&
            crypto.randomUUID
              ? crypto.randomUUID()
              : String(
                  Date.now()
                ) +
                '-' +
                Math.random()
                  .toString(36)
                  .slice(2)
          ),

        file:
          file,

        name:
          cleanFileName(
            file.name
          ),

        title:
          '',

        artist:
          '',

        album:
          '',

        albumArtist:
          '',

        genre:
          '',

        year:
          '',

        track:
          '',

        disc:
          '',

        composer:
          '',

        comment:
          '',

        url:
          null,

        duration:
          0,

        artworkUrl:
          null,

        artworkType:
          '',

        metadataLoaded:
          false

      };

      tracks.push(
        track
      );

      saveTrackToDatabase(
        track
      );

      added++;

    }

    if (
      added
    ) {

      renderAllLibraries();

      if (
        currentIndex === -1
      ) {

        loadTrack(
          0,
          false
        );

      }

      setStatus(
        added +
        (
          added === 1
            ? ' audio file added.'
            : ' audio files added.'
        )
      );

      enrichTrackQueue(
        tracks,
        0
      );

    } else {

      setStatus(
        'No new audio files were added.'
      );

    }

  }

  function renderAllLibraries() {

    renderPlaylist();

    renderSongList();

    renderGenreList();

    renderAlbumList();

    renderArtistList();

  }

  function renderSongList() {

    songList.innerHTML =
      '';

    var indexes =
      [];

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      indexes.push(
        i
      );

    }

    indexes.sort(
      function (a, b) {

        return getTrackDisplayTitle(
          tracks[a]
        ).localeCompare(
          getTrackDisplayTitle(
            tracks[b]
          )
        );

      }
    );

    for (
      var j = 0;
      j < indexes.length;
      j++
    ) {

      var index =
        indexes[j];

      songList.appendChild(
        createLibraryItem(
          getTrackDisplayTitle(
            tracks[index]
          ),
          getTrackDisplayArtist(
            tracks[index]
          ),
          indexes.slice(
            j,
            j + 1
          ),
          '🎵'
        )
      );

    }

  }

  function renderGenreList() {

    genreList.innerHTML =
      '';

    var groups =
      {};

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      var value =
        trimText(
          tracks[i].genre
        ) ||
        'Unknown Genre';

      if (
        !groups[value]
      ) {

        groups[value] =
          [];

      }

      groups[value].push(
        i
      );

    }

    var names =
      Object.keys(
        groups
      ).sort(
        function (a, b) {
          return a.localeCompare(
            b
          );
        }
      );

    for (
      var j = 0;
      j < names.length;
      j++
    ) {

      var name =
        names[j];

      genreList.appendChild(
        createLibraryItem(
          name,
          groups[name].length +
            (
              groups[name].length === 1
                ? ' song'
                : ' songs'
            ),
          groups[name],
          '🎼'
        )
      );

    }

  }

  function renderAlbumList() {

    albumList.innerHTML =
      '';

    var groups =
      {};

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      var value =
        trimText(
          tracks[i].album
        ) ||
        'Unknown Album';

      if (
        !groups[value]
      ) {

        groups[value] =
          [];

      }

      groups[value].push(
        i
      );

    }

    var names =
      Object.keys(
        groups
      ).sort(
        function (a, b) {
          return a.localeCompare(
            b
          );
        }
      );

    for (
      var j = 0;
      j < names.length;
      j++
    ) {

      var name =
        names[j];

      albumList.appendChild(
        createLibraryItem(
          name,
          groups[name].length +
            (
              groups[name].length === 1
                ? ' song'
                : ' songs'
            ),
          groups[name],
          '💿'
        )
      );

    }

  }

  function renderArtistList() {

    artistList.innerHTML =
      '';

    var groups =
      {};

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      var value =
        trimText(
          tracks[i].artist
        ) ||
        'Unknown Artist';

      if (
        !groups[value]
      ) {

        groups[value] =
          [];

      }

      groups[value].push(
        i
      );

    }

    var names =
      Object.keys(
        groups
      ).sort(
        function (a, b) {
          return a.localeCompare(
            b
          );
        }
      );

    for (
      var j = 0;
      j < names.length;
      j++
    ) {

      var name =
        names[j];

      artistList.appendChild(
        createLibraryItem(
          name,
          groups[name].length +
            (
              groups[name].length === 1
                ? ' song'
                : ' songs'
            ),
          groups[name],
          '👤'
        )
      );

    }

  }

  function createLibraryItem(
    title,
    subtitle,
    indexes,
    icon
  ) {

    var item =
      document.createElement(
        'button'
      );

    item.type =
      'button';

    item.className =
      'appu-mp3-library-item';

    var iconElement =
      document.createElement(
        'span'
      );

    iconElement.className =
      'appu-mp3-library-icon';

    iconElement.textContent =
      icon;

    var info =
      document.createElement(
        'span'
      );

    info.className =
      'appu-mp3-library-info';

    var titleElement =
      document.createElement(
        'span'
      );

    titleElement.className =
      'appu-mp3-library-title';

    titleElement.textContent =
      title;

    var subtitleElement =
      document.createElement(
        'span'
      );

    subtitleElement.className =
      'appu-mp3-library-subtitle';

    subtitleElement.textContent =
      subtitle;

    info.appendChild(
      titleElement
    );

    info.appendChild(
      subtitleElement
    );

    item.appendChild(
      iconElement
    );

    item.appendChild(
      info
    );

    item.addEventListener(
      'click',
      function () {

        if (
          indexes.length
        ) {

          loadTrack(
            indexes[0],
            true
          );

          switchLibraryPanel(
            0
          );

        }

      }
    );

    return item;

  }

  function switchLibraryPanel(
    panel
  ) {

    if (
      panel < 0 ||
      panel > 4
    ) {

      return;

    }

    selectedPanel =
      panel;

    libraryTrack.style.transform =
      'translateX(-' +
      (
        panel * 20
      ) +
      '%)';

    for (
      var i = 0;
      i < tabs.length;
      i++
    ) {

      var selected =
        Number(
          tabs[i].getAttribute(
            'data-panel'
          )
        ) === panel;

      tabs[i].classList.toggle(
        'appu-selected',
        selected
      );

      tabs[i].setAttribute(
        'aria-selected',
        selected
          ? 'true'
          : 'false'
      );

    }

    if (
      tabs[panel]
    ) {

      tabs[panel].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });

    }

  }

  for (
    var t = 0;
    t < tabs.length;
    t++
  ) {

    tabs[t].addEventListener(
      'click',
      function () {

        switchLibraryPanel(
          Number(
            this.getAttribute(
              'data-panel'
            )
          )
        );

      }
    );

  }

  var swipeStartX =
    0;

  var swipeStartY =
    0;

  var swipeActive =
    false;

  libraryViewport.addEventListener(
    'touchstart',
    function (event) {

      if (
        !event.touches.length
      ) {

        return;

      }

      swipeStartX =
        event.touches[0].clientX;

      swipeStartY =
        event.touches[0].clientY;

      swipeActive =
        true;

    },
    {
      passive: true
    }
  );

  libraryViewport.addEventListener(
    'touchend',
    function (event) {

      if (
        !swipeActive ||
        !event.changedTouches.length
      ) {

        return;

      }

      swipeActive =
        false;

      var deltaX =
        event.changedTouches[0].clientX -
        swipeStartX;

      var deltaY =
        event.changedTouches[0].clientY -
        swipeStartY;

      if (
        Math.abs(deltaX) <=
        Math.abs(deltaY)
      ) {

        return;

      }

      if (
        Math.abs(deltaX) < 45
      ) {

        return;

      }

      if (
        deltaX < 0 &&
        selectedPanel < 4
      ) {

        switchLibraryPanel(
          selectedPanel + 1
        );

      }

      if (
        deltaX > 0 &&
        selectedPanel > 0
      ) {

        switchLibraryPanel(
          selectedPanel - 1
        );

      }

    },
    {
      passive: true
    }
  );

  function updateMediaSession() {

    if (
      !('mediaSession' in navigator)
    ) {

      return;

    }

    if (
      currentIndex < 0 ||
      !tracks[currentIndex]
    ) {

      return;

    }

    var track =
      tracks[currentIndex];

    var metadata = {

      title:
        track.title ||
        track.name ||
        'Unknown Song',

      artist:
        track.artist ||
        'Unknown Artist',

      album:
        track.album ||
        'Appu.uk Local Music'

    };

    if (
      track.artworkUrl
    ) {

      metadata.artwork = [

        {
          src:
            track.artworkUrl,

          type:
            track.artworkType ||
            'image/jpeg'
        }

      ];

    }

    try {

      navigator.mediaSession.metadata =
        new MediaMetadata(
          metadata
        );

      setMediaSessionHandler(
        'previoustrack',
        function () {
          previousTrack();
        }
      );

      setMediaSessionHandler(
        'nexttrack',
        function () {
          nextTrack();
        }
      );

      setMediaSessionHandler(
        'play',
        function () {

          initializeAudioGraph();

          var promise =
            audio.play();

          if (
            promise &&
            typeof promise.catch ===
              'function'
          ) {

            promise.catch(
              function () {}
            );

          }

        }
      );

      setMediaSessionHandler(
        'pause',
        function () {
          audio.pause();
        }
      );

      setMediaSessionHandler(
        'seekbackward',
        function (details) {

          var offset =
            details.seekOffset ||
            10;

          audio.currentTime =
            Math.max(
              0,
              audio.currentTime -
              offset
            );

        }
      );

      setMediaSessionHandler(
        'seekforward',
        function (details) {

          var offset =
            details.seekOffset ||
            10;

          audio.currentTime =
            Math.min(
              audio.duration ||
              Infinity,
              audio.currentTime +
              offset
            );

        }
      );

      setMediaSessionHandler(
        'seekto',
        function (details) {

          if (
            isFinite(
              details.seekTime
            )
          ) {

            audio.currentTime =
              details.seekTime;

          }

        }
      );

      updateMediaPlaybackState();

      updateMediaPosition();

    } catch (error) {}

  }

  function setMediaSessionHandler(
    action,
    handler
  ) {

    if (
      !('mediaSession' in navigator)
    ) {

      return;

    }

    try {

      navigator.mediaSession.setActionHandler(
        action,
        handler
      );

    } catch (error) {}

  }

  function updateMediaPlaybackState() {

    if (
      !('mediaSession' in navigator)
    ) {

      return;

    }

    try {

      navigator.mediaSession.playbackState =
        audio.paused
          ? 'paused'
          : 'playing';

    } catch (error) {}

  }

  function updateMediaPosition() {

    if (
      !('mediaSession' in navigator)
    ) {

      return;

    }

    if (
      !isFinite(
        audio.duration
      ) ||
      audio.duration <= 0
    ) {

      return;

    }

    try {

      if (
        typeof navigator.mediaSession
          .setPositionState ===
          'function'
      ) {

        navigator.mediaSession.setPositionState({

          duration:
            audio.duration,

          playbackRate:
            audio.playbackRate || 1,

          position:
            Math.min(
              audio.currentTime,
              audio.duration
            )

        });

      }

    } catch (error) {}

  }

  audio.addEventListener(
    'timeupdate',
    updateProgress
  );

  audio.addEventListener(
    'loadedmetadata',
    updateProgress
  );

  audio.addEventListener(
    'ended',
    function () {

      if (
        repeatMode === 2
      ) {

        audio.currentTime =
          0;

        audio.play();

        return;

      }

      if (
        repeatMode === 1 ||
        currentIndex <
          tracks.length - 1
      ) {

        nextTrack();

        return;

      }

      updatePlayButton();

      updateMediaPlaybackState();

    }
  );

  if (playButton) {

    playButton.addEventListener(
      'click',
      togglePlay
    );

  }

  if (prevButton) {

    prevButton.addEventListener(
      'click',
      previousTrack
    );

  }

  if (nextButton) {

    nextButton.addEventListener(
      'click',
      nextTrack
    );

  }

  if (backButton) {

    backButton.addEventListener(
      'click',
      function () {

        seekBy(
          -10
        );

      }
    );

  }

  if (forwardButton) {

    forwardButton.addEventListener(
      'click',
      function () {

        seekBy(
          10
        );

      }
    );

  }

  if (progress) {

    progress.addEventListener(
      'input',
      function () {

        if (
          isFinite(
            audio.duration
          )
        ) {

          audio.currentTime =
            (
              Number(
                progress.value
              ) /
              100
            ) *
            audio.duration;

        }

      }
    );

  }

  if (volume) {

    volume.addEventListener(
      'input',
      function () {

        audio.volume =
          Number(
            volume.value
          );

        audio.muted =
          false;

        updateVolumeIcon();

      }
    );

  }

  if (volumeIcon) {

    volumeIcon.addEventListener(
      'click',
      function () {

        if (
          audio.muted ||
          audio.volume === 0
        ) {

          audio.muted =
            false;

          audio.volume =
            volumeBeforeMute ||
            1;

          volume.value =
            audio.volume;

        } else {

          volumeBeforeMute =
            audio.volume;

          audio.muted =
            true;

        }

        updateVolumeIcon();

      }
    );

  }

  if (shuffleButton) {

    shuffleButton.addEventListener(
      'click',
      toggleShuffle
    );

  }

  if (repeatButton) {

    repeatButton.addEventListener(
      'click',
      toggleRepeat
    );

  }

  if (fileInput) {

    fileInput.addEventListener(
      'change',
      function () {

        scanMin =
          0;

        scanMax =
          0;

        addFiles(
          fileInput.files
        );

        fileInput.value =
          '';

      }
    );

  }

  if (scanButton) {

    scanButton.addEventListener(
      'click',
      function () {

        closeModal(
          scanModal
        );

        if (fileInput) {

          fileInput.click();

        }

      }
    );

  }

  if (eqButton) {

    eqButton.addEventListener(
      'click',
      function () {

        initializeAudioGraph();

        updateEqualizerUI();

        openModal(
          eqModal
        );

      }
    );

  }

  if (barButton) {

    barButton.addEventListener(
      'click',
      function () {

        visualizer.classList.toggle(
          'appu-hidden'
        );

      }
    );

  }

  if (eqModal) {

    var eqSliders =
      eqModal.querySelectorAll(
        '[data-eq-band]'
      );

    for (
      var e = 0;
      e < eqSliders.length;
      e++
    ) {

      eqSliders[e].addEventListener(
        'input',
        function () {

          initializeAudioGraph();

          setEqualizerBand(
            Number(
              this.getAttribute(
                'data-eq-band'
              )
            ),
            this.value
          );

        }
      );

    }

    var eqReset =
      eqModal.querySelector(
        '[data-eq-reset]'
      );

    if (eqReset) {

      eqReset.addEventListener(
        'click',
        resetEqualizer
      );

    }

  }

  var closeButtons =
    document.querySelectorAll(
      '[data-appu-modal-close]'
    );

  for (
    var c = 0;
    c < closeButtons.length;
    c++
  ) {

    closeButtons[c].addEventListener(
      'click',
      function () {

        var targetId =
          this.getAttribute(
            'data-appu-modal-close'
          );

        var target =
          document.getElementById(
            targetId
          );

        if (target) {

          closeModal(
            target
          );

        }

      }
    );

  }

  document.addEventListener(
    'click',
    function (event) {

      if (
        event.target === scanModal
      ) {

        closeModal(
          scanModal
        );

      }

      if (
        event.target === eqModal
      ) {

        closeModal(
          eqModal
        );

      }

    }
  );

  audio.addEventListener(
    'play',
    function () {

      initializeAudioGraph();

      updatePlayButton();

      renderAllLibraries();

      updateMediaPlaybackState();

      setStatus(
        'Playing: ' +
        (
          tracks[currentIndex]
            ? (
                tracks[currentIndex].title ||
                tracks[currentIndex].name
              )
            : ''
        )
      );

    }
  );

  audio.addEventListener(
    'pause',
    function () {

      updatePlayButton();

      renderAllLibraries();

      updateMediaPlaybackState();

    }
  );

  audio.addEventListener(
    'error',
    function () {

      setStatus(
        'This audio file could not be played by your browser.'
      );

      updateMediaPlaybackState();

    }
  );

  dropzone.addEventListener(
    'click',
    function () {

      openModal(
        scanModal
      );

    }
  );

  dropzone.addEventListener(
    'keydown',
    function (event) {

      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {

        event.preventDefault();

        openModal(
          scanModal
        );

      }

    }
  );

  dropzone.addEventListener(
    'dragover',
    function (event) {

      event.preventDefault();

      dropzone.classList.add(
        'appu-drag-active'
      );

    }
  );

  dropzone.addEventListener(
    'dragleave',
    function () {

      dropzone.classList.remove(
        'appu-drag-active'
      );

    }
  );

  dropzone.addEventListener(
    'drop',
    function (event) {

      event.preventDefault();

      dropzone.classList.remove(
        'appu-drag-active'
      );

      scanMin =
        0;

      scanMax =
        0;

      addFiles(
        event.dataTransfer.files
      );

    }
  );

  document.addEventListener(
    'keydown',
    function (event) {

      var target =
        event.target;

      if (
        target &&
        (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'BUTTON'
        )
      ) {

        return;

      }

      if (
        event.code === 'Space'
      ) {

        event.preventDefault();

        togglePlay();

      }

      if (
        event.code === 'ArrowLeft'
      ) {

        audio.currentTime =
          Math.max(
            0,
            audio.currentTime - 10
          );

      }

      if (
        event.code === 'ArrowRight'
      ) {

        audio.currentTime =
          Math.min(
            audio.duration ||
            Infinity,
            audio.currentTime + 10
          );

      }

    }
  );

  audio.volume =
    1;

  volume.value =
    1;

  updateVolumeIcon();

  updatePlayButton();

  renderAllLibraries();

  /*
   * Restore the local music library after the
   * initial UI has been prepared.
   */
  openMusicDatabase();

  if (
    'mediaSession' in navigator
  ) {

    setMediaSessionHandler(
      'previoustrack',
      previousTrack
    );

    setMediaSessionHandler(
      'nexttrack',
      nextTrack
    );

  }

  if (
    'serviceWorker' in navigator
  ) {

    window.addEventListener(
      'load',
      function () {

        navigator.serviceWorker.register(
          './sw.js',
          {
            scope: './'
          }
        );

      }
    );

  }

})();
