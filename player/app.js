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

  function uint32BE(bytes, offset) {

    return (
      ((bytes[offset] || 0) << 24) |
      ((bytes[offset + 1] || 0) << 16) |
      ((bytes[offset + 2] || 0) << 8) |
      (bytes[offset + 3] || 0)
    ) >>> 0;

  }

  function uint24BE(bytes, offset) {

    return (
      ((bytes[offset] || 0) << 16) |
      ((bytes[offset + 1] || 0) << 8) |
      (bytes[offset + 2] || 0)
    ) >>> 0;

  }

  function syncSafe(bytes, offset) {

    return (
      ((bytes[offset] || 0) & 0x7f) * 2097152 +
      ((bytes[offset + 1] || 0) & 0x7f) * 16384 +
      ((bytes[offset + 2] || 0) & 0x7f) * 128 +
      ((bytes[offset + 3] || 0) & 0x7f)
    );

  }

  function decodeLatin1(bytes) {

    var result = '';

    for (
      var i = 0;
      i < bytes.length;
      i++
    ) {

      result +=
        String.fromCharCode(
          bytes[i]
        );

    }

    return result;

  }

  function decodeUTF16BE(bytes) {

    var result = '';

    for (
      var i = 0;
      i + 1 < bytes.length;
      i += 2
    ) {

      result +=
        String.fromCharCode(
          (bytes[i] << 8) |
          bytes[i + 1]
        );

    }

    return result;

  }

  function decodeID3Text(
    bytes,
    encoding
  ) {

    if (!bytes || !bytes.length) {
      return '';
    }

    var data =
      bytes;

    if (
      encoding === 1 &&
      data.length >= 2
    ) {

      if (
        data[0] === 0xFF &&
        data[1] === 0xFE
      ) {

        data =
          data.slice(2);

        try {

          return new TextDecoder(
            'utf-16le'
          ).decode(
            data
          );

        } catch (error) {

          return decodeLatin1(
            data
          );

        }

      }

      if (
        data[0] === 0xFE &&
        data[1] === 0xFF
      ) {

        data =
          data.slice(2);

        return decodeUTF16BE(
          data
        );

      }

    }

    if (encoding === 2) {

      return decodeUTF16BE(
        data
      );

    }

    try {

      if (
        encoding === 3 &&
        typeof TextDecoder !==
          'undefined'
      ) {

        return new TextDecoder(
          'utf-8'
        ).decode(
          data
        );

      }

      if (
        typeof TextDecoder !==
          'undefined'
      ) {

        return new TextDecoder(
          'iso-8859-1'
        ).decode(
          data
        );

      }

    } catch (error) {}

    return decodeLatin1(
      data
    );

  }

  function findTextEnd(
    bytes,
    start,
    encoding
  ) {

    if (
      encoding === 0 ||
      encoding === 3
    ) {

      for (
        var i = start;
        i < bytes.length;
        i++
      ) {

        if (bytes[i] === 0) {
          return i;
        }

      }

      return bytes.length;

    }

    for (
      var j = start;
      j + 1 < bytes.length;
      j += 2
    ) {

      if (
        bytes[j] === 0 &&
        bytes[j + 1] === 0
      ) {

        return j;

      }

    }

    return bytes.length;

  }

  var id3Genres = {

    0: 'Blues',
    1: 'Classic Rock',
    2: 'Country',
    3: 'Dance',
    4: 'Disco',
    5: 'Funk',
    6: 'Grunge',
    7: 'Hip-Hop',
    8: 'Jazz',
    9: 'Metal',
    10: 'New Age',
    11: 'Oldies',
    12: 'Other',
    13: 'Pop',
    14: 'R&B',
    15: 'Rap',
    16: 'Reggae',
    17: 'Rock',
    18: 'Techno',
    19: 'Industrial',
    20: 'Alternative',
    21: 'Ska',
    22: 'Death Metal',
    23: 'Pranks',
    24: 'Soundtrack',
    25: 'Euro-Techno',
    26: 'Ambient',
    27: 'Trip-Hop',
    28: 'Vocal',
    29: 'Jazz+Funk',
    30: 'Fusion',
    31: 'Trance',
    32: 'Classical',
    33: 'Instrumental',
    34: 'Acid',
    35: 'House',
    36: 'Game',
    37: 'Sound Clip',
    38: 'Gospel',
    39: 'Noise',
    40: 'AlternRock',
    41: 'Bass',
    42: 'Soul',
    43: 'Punk',
    44: 'Space',
    45: 'Meditative',
    46: 'Instrumental Pop',
    47: 'Instrumental Rock',
    48: 'Ethnic',
    49: 'Gothic',
    50: 'Darkwave',
    51: 'Techno-Industrial',
    52: 'Electronic',
    53: 'Pop-Folk',
    54: 'Eurodance',
    55: 'Dream',
    56: 'Southern Rock',
    57: 'Comedy',
    58: 'Cult',
    59: 'Gangsta',
    60: 'Top 40',
    61: 'Christian Rap',
    62: 'Pop/Funk',
    63: 'Jungle',
    64: 'Native American',
    65: 'Cabaret',
    66: 'New Wave',
    67: 'Psychadelic',
    68: 'Rave',
    69: 'Showtunes',
    70: 'Trailer',
    71: 'Lo-Fi',
    72: 'Tribal',
    73: 'Acid Punk',
    74: 'Acid Jazz',
    75: 'Polka',
    76: 'Retro',
    77: 'Musical',
    78: 'Rock & Roll',
    79: 'Hard Rock'
  };

  function normalizeGenre(value) {

    value =
      trimText(value);

    if (!value) {
      return '';
    }

    var match =
      value.match(
        /^\((\d+)\)/
      );

    if (match) {

      var number =
        Number(
          match[1]
        );

      if (
        id3Genres[number]
      ) {

        return id3Genres[number];

      }

    }

    return value;

  }

  function detectImageType(bytes) {

    if (
      bytes.length >= 3 &&
      bytes[0] === 0xFF &&
      bytes[1] === 0xD8 &&
      bytes[2] === 0xFF
    ) {

      return 'image/jpeg';

    }

    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47
    ) {

      return 'image/png';

    }

    if (
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46
    ) {

      return 'image/gif';

    }

    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {

      return 'image/webp';

    }

    return '';

  }

  function parseAPIC(
    frameBytes
  ) {

    if (
      frameBytes.length < 5
    ) {
      return null;
    }

    var encoding =
      frameBytes[0];

    var position =
      1;

    var mimeEnd =
      position;

    while (
      mimeEnd <
      frameBytes.length &&
      frameBytes[mimeEnd] !== 0
    ) {

      mimeEnd++;

    }

    var mime =
      decodeLatin1(
        frameBytes.slice(
          position,
          mimeEnd
        )
      );

    position =
      mimeEnd + 1;

    if (
      position >=
      frameBytes.length
    ) {
      return null;
    }

    position++;

    var descriptionEnd =
      findTextEnd(
        frameBytes,
        position,
        encoding
      );

    position =
      descriptionEnd;

    if (
      encoding === 0 ||
      encoding === 3
    ) {

      position++;

    } else {

      position += 2;

    }

    if (
      position >=
      frameBytes.length
    ) {

      return null;

    }

    var imageBytes =
      frameBytes.slice(
        position
      );

    if (
      !imageBytes.length
    ) {

      return null;

    }

    var detectedType =
      detectImageType(
        imageBytes
      );

    if (
      !detectedType &&
      mime.indexOf('image/') === 0
    ) {

      detectedType =
        mime;

    }

    if (!detectedType) {
      return null;
    }

    return {

      type:
        detectedType,

      bytes:
        imageBytes

    };

  }

  function parsePIC(
    frameBytes
  ) {

    if (
      frameBytes.length < 6
    ) {

      return null;

    }

    var encoding =
      frameBytes[0];

    var format =
      decodeLatin1(
        frameBytes.slice(
          1,
          4
        )
      ).toLowerCase();

    var position =
      4;

    position++;

    var descriptionEnd =
      findTextEnd(
        frameBytes,
        position,
        encoding
      );

    position =
      descriptionEnd;

    if (
      encoding === 0 ||
      encoding === 3
    ) {

      position++;

    } else {

      position += 2;

    }

    var imageBytes =
      frameBytes.slice(
        position
      );

    if (
      !imageBytes.length
    ) {

      return null;

    }

    var type =
      detectImageType(
        imageBytes
      );

    if (!type) {

      if (
        format === 'jpg' ||
        format === 'jpeg'
      ) {

        type =
          'image/jpeg';

      } else if (
        format === 'png'
      ) {

        type =
          'image/png';

      }

    }

    if (!type) {
      return null;
    }

    return {

      type:
        type,

      bytes:
        imageBytes

    };

  }

  function parseID3v2(
    buffer
  ) {

    var bytes =
      new Uint8Array(
        buffer
      );

    if (
      bytes.length < 10 ||
      bytes[0] !== 0x49 ||
      bytes[1] !== 0x44 ||
      bytes[2] !== 0x33
    ) {

      return null;

    }

    var major =
      bytes[3];

    var flags =
      bytes[5];

    var tagSize =
      syncSafe(
        bytes,
        6
      );

    var end =
      Math.min(
        bytes.length,
        10 + tagSize
      );

    var tagBytes =
      bytes.slice(
        10,
        end
      );

    if (
      flags & 0x80
    ) {

      var clean = [];

      for (
        var u = 0;
        u < tagBytes.length;
        u++
      ) {

        if (
          tagBytes[u] === 0xFF &&
          tagBytes[u + 1] === 0x00
        ) {

          clean.push(
            0xFF
          );

          u++;

        } else {

          clean.push(
            tagBytes[u]
          );

        }

      }

      tagBytes =
        new Uint8Array(
          clean
        );

    }

    var result = {

      title: '',
      artist: '',
      album: '',
      albumArtist: '',
      genre: '',
      year: '',
      track: '',
      disc: '',
      composer: '',
      comment: '',
      artwork: null

    };

    function assignText(
      id,
      value
    ) {

      value =
        trimText(value);

      if (!value) {
        return;
      }

      if (
        id === 'TIT2' ||
        id === 'TT2'
      ) {

        result.title =
          value;

      } else if (
        id === 'TPE1' ||
        id === 'TP1'
      ) {

        result.artist =
          value;

      } else if (
        id === 'TALB' ||
        id === 'TAL'
      ) {

        result.album =
          value;

      } else if (
        id === 'TPE2' ||
        id === 'TP2'
      ) {

        result.albumArtist =
          value;

      } else if (
        id === 'TCON' ||
        id === 'TCO'
      ) {

        result.genre =
          normalizeGenre(
            value
          );

      } else if (
        id === 'TDRC' ||
        id === 'TYER' ||
        id === 'TYE'
      ) {

        result.year =
          value;

      } else if (
        id === 'TRCK' ||
        id === 'TRK'
      ) {

        result.track =
          value;

      } else if (
        id === 'TPOS'
      ) {

        result.disc =
          value;

      } else if (
        id === 'TCOM' ||
        id === 'TCM'
      ) {

        result.composer =
          value;

      }

    }

    var offset =
      0;

    if (major === 2) {

      while (
        offset + 6 <=
        tagBytes.length
      ) {

        var id22 =
          decodeLatin1(
            tagBytes.slice(
              offset,
              offset + 3
            )
          );

        if (
          !/^[A-Z0-9]{3}$/.test(
            id22
          )
        ) {

          break;

        }

        var size22 =
          uint24BE(
            tagBytes,
            offset + 3
          );

        if (
          size22 <= 0 ||
          offset + 6 + size22 >
            tagBytes.length
        ) {

          break;

        }

        var frame22 =
          tagBytes.slice(
            offset + 6,
            offset + 6 + size22
          );

        if (
          id22 === 'PIC'
        ) {

          if (!result.artwork) {

            result.artwork =
              parsePIC(
                frame22
              );

          }

        } else if (
          frame22.length
        ) {

          var enc22 =
            frame22[0];

          var value22 =
            decodeID3Text(
              frame22.slice(1),
              enc22
            );

          assignText(
            id22,
            value22
          );

        }

        offset +=
          6 + size22;

      }

    } else {

      offset =
        0;

      if (
        flags & 0x40 &&
        tagBytes.length >= 4
      ) {

        var extendedSize;

        if (major === 4) {

          extendedSize =
            syncSafe(
              tagBytes,
              0
            );

        } else {

          extendedSize =
            uint32BE(
              tagBytes,
              0
            );

        }

        offset =
          Math.min(
            tagBytes.length,
            extendedSize + 4
          );

      }

      while (
        offset + 10 <=
        tagBytes.length
      ) {

        var id =
          decodeLatin1(
            tagBytes.slice(
              offset,
              offset + 4
            )
          );

        if (
          !/^[A-Z0-9]{4}$/.test(
            id
          )
        ) {

          break;

        }

        var frameSize;

        if (major === 4) {

          frameSize =
            syncSafe(
              tagBytes,
              offset + 4
            );

        } else {

          frameSize =
            uint32BE(
              tagBytes,
              offset + 4
            );

        }

        if (
          frameSize <= 0 ||
          offset + 10 + frameSize >
            tagBytes.length
        ) {

          break;

        }

        var frame =
          tagBytes.slice(
            offset + 10,
            offset + 10 + frameSize
          );

        if (
          id === 'APIC'
        ) {

          if (!result.artwork) {

            result.artwork =
              parseAPIC(
                frame
              );

          }

        } else if (
          id === 'COMM'
        ) {

          if (
            frame.length > 4
          ) {

            var commentEncoding =
              frame[0];

            var commentStart =
              4;

            var commentEnd =
              findTextEnd(
                frame,
                commentStart,
                commentEncoding
              );

            var commentText =
              decodeID3Text(
                frame.slice(
                  commentStart,
                  commentEnd
                ),
                commentEncoding
              );

            if (
              commentText
            ) {

              result.comment =
                trimText(
                  commentText
                );

            }

          }

        } else if (
          id.charAt(0) === 'T'
        ) {

          if (frame.length) {

            var encoding =
              frame[0];

            var text =
              decodeID3Text(
                frame.slice(1),
                encoding
              );

            assignText(
              id,
              text
            );

          }

        }

        offset +=
          10 + frameSize;

      }

    }

    return result;

  }

  function parseID3v1(
    buffer
  ) {

    var bytes =
      new Uint8Array(
        buffer
      );

    if (
      bytes.length < 128 ||
      bytes[0] !== 0x54 ||
      bytes[1] !== 0x41 ||
      bytes[2] !== 0x47
    ) {

      return null;

    }

    function field(
      start,
      length
    ) {

      return trimText(
        decodeLatin1(
          bytes.slice(
            start,
            start + length
          )
        )
      );

    }

    var result = {

      title:
        field(3,30),

      artist:
        field(33,30),

      album:
        field(63,30),

      year:
        field(93,4),

      comment:
        field(97,30),

      track: '',

      genre: ''

    };

    if (
      bytes[125] === 0 &&
      bytes[126]
    ) {

      result.comment =
        field(97,28);

      result.track =
        String(
          bytes[126]
        );

    }

    if (
      id3Genres[
        bytes[127]
      ]
    ) {

      result.genre =
        id3Genres[
          bytes[127]
        ];

    }

    return result;

  }

  function readID3Metadata(
    file,
    callback
  ) {

    var firstReader =
      new FileReader();

    firstReader.onload =
      function () {

        var firstBuffer =
          firstReader.result;

        var firstBytes =
          new Uint8Array(
            firstBuffer
          );

        var id3Size = 0;

        var hasID3 =
          firstBytes.length >= 10 &&
          firstBytes[0] === 0x49 &&
          firstBytes[1] === 0x44 &&
          firstBytes[2] === 0x33;

        if (hasID3) {

          id3Size =
            syncSafe(
              firstBytes,
              6
            );

        }

        var id3Result =
          null;

        function readID3v1Fallback() {

          var start =
            Math.max(
              0,
              file.size - 128
            );

          if (
            file.size < 128
          ) {

            callback(
              id3Result
            );

            return;

          }

          var v1Reader =
            new FileReader();

          v1Reader.onload =
            function () {

              var v1 =
                parseID3v1(
                  v1Reader.result
                );

              if (v1) {

                if (!id3Result) {
                  id3Result = {};
                }

                var keys = [
                  'title',
                  'artist',
                  'album',
                  'year',
                  'comment',
                  'track',
                  'genre'
                ];

                for (
                  var k = 0;
                  k < keys.length;
                  k++
                ) {

                  var key =
                    keys[k];

                  if (
                    !id3Result[key] &&
                    v1[key]
                  ) {

                    id3Result[key] =
                      v1[key];

                  }

                }

              }

              callback(
                id3Result
              );

            };

          v1Reader.onerror =
            function () {

              callback(
                id3Result
              );

            };

          v1Reader.readAsArrayBuffer(
            file.slice(
              start
            )
          );

        }

        if (!hasID3) {

          readID3v1Fallback();

          return;

        }

        var totalSize =
          Math.min(
            file.size,
            10 + id3Size
          );

        totalSize =
          Math.min(
            totalSize,
            32 * 1024 * 1024
          );

        var tagReader =
          new FileReader();

        tagReader.onload =
          function () {

            id3Result =
              parseID3v2(
                tagReader.result
              );

            readID3v1Fallback();

          };

        tagReader.onerror =
          function () {

            readID3v1Fallback();

          };

        tagReader.readAsArrayBuffer(
          file.slice(
            0,
            totalSize
          )
        );

      };

    firstReader.onerror =
      function () {

        callback(null);

      };

    firstReader.readAsArrayBuffer(
      file.slice(
        0,
        10
      )
    );

  }

  function applyMetadata(
    track,
    metadata
  ) {

    if (!metadata) {
      return;
    }

    if (
      metadata.title
    ) {

      track.title =
        trimText(
          metadata.title
        );

    }

    if (
      metadata.artist
    ) {

      track.artist =
        trimText(
          metadata.artist
        );

    }

    if (
      metadata.album
    ) {

      track.album =
        trimText(
          metadata.album
        );

    }

    if (
      metadata.albumArtist
    ) {

      track.albumArtist =
        trimText(
          metadata.albumArtist
        );

    }

    if (
      metadata.genre
    ) {

      track.genre =
        normalizeGenre(
          metadata.genre
        );

    }

    if (
      metadata.year
    ) {

      track.year =
        trimText(
          metadata.year
        );

    }

    if (
      metadata.track
    ) {

      track.track =
        trimText(
          metadata.track
        );

    }

    if (
      metadata.disc
    ) {

      track.disc =
        trimText(
          metadata.disc
        );

    }

    if (
      metadata.composer
    ) {

      track.composer =
        trimText(
          metadata.composer
        );

    }

    if (
      metadata.comment
    ) {

      track.comment =
        trimText(
          metadata.comment
        );

    }

    if (
      metadata.artwork
    ) {

      if (
        track.artworkUrl
      ) {

        URL.revokeObjectURL(
          track.artworkUrl
        );

      }

      var blob =
        new Blob(
          [
            metadata.artwork.bytes
          ],
          {
            type:
              metadata.artwork.type
          }
        );

      track.artworkUrl =
        URL.createObjectURL(
          blob
        );

      track.artworkType =
        metadata.artwork.type;

    }

    track.name =
      track.title ||
      track.name;

  }

  function extractFilenameMetadata(
    track
  ) {

    var parts =
      track.name.split(
        ' - '
      );

    if (
      !track.artist &&
      parts.length >= 2
    ) {

      track.artist =
        parts[0].trim();

    }

    if (
      !track.album &&
      parts.length >= 3
    ) {

      track.album =
        parts[1].trim();

    }

    if (
      !track.title
    ) {

      if (
        parts.length >= 3
      ) {

        track.title =
          parts.slice(
            2
          ).join(
            ' - '
          ).trim();

      } else {

        track.title =
          track.name;

      }

    }

    if (
      !track.genre
    ) {

      var lower =
        track.name.toLowerCase();

      var genres = [
        'rock',
        'pop',
        'jazz',
        'classical',
        'electronic',
        'dance',
        'metal',
        'country',
        'blues',
        'reggae',
        'hip hop',
        'rap',
        'soundtrack',
        'ambient',
        'slow rock'
      ];

      for (
        var i = 0;
        i < genres.length;
        i++
      ) {

        if (
          lower.indexOf(
            genres[i]
          ) !== -1
        ) {

          track.genre =
            genres[i];

          break;

        }

      }

    }

  }

  function enrichTrack(
    track
  ) {

    if (
      getExtension(
        track.file.name
      ) !== 'mp3'
    ) {

      extractFilenameMetadata(
        track
      );

      track.metadataLoaded =
        true;

      renderAllLibraries();

      return;

    }

    readID3Metadata(
      track.file,
      function (metadata) {

        extractFilenameMetadata(
          track
        );

        applyMetadata(
          track,
          metadata
        );

        track.title =
          track.title ||
          track.name;

        track.artist =
          track.artist ||
          'Unknown Artist';

        track.album =
          track.album ||
          'Unknown Album';

        track.genre =
          track.genre ||
          'Unknown';

        track.metadataLoaded =
          true;

        renderAllLibraries();

        if (
          currentIndex >= 0 &&
          tracks[currentIndex] === track
        ) {

          updateCurrentTrackDisplay();

          updateMediaSession();

        }

      }
    );

  }

  function initializeAudioGraph() {

    if (audioGraphReady) {

      if (
        audioContext &&
        audioContext.state ===
          'suspended'
      ) {

        audioContext.resume();

      }

      return;

    }

    var AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {

      setStatus(
        'Web Audio is not supported by this browser.'
      );

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

      analyser.smoothingTimeConstant =
        .78;

      var previousNode =
        mediaSource;

      for (
        var i = 0;
        i < eqBands.length;
        i++
      ) {

        var filter =
          audioContext.createBiquadFilter();

        filter.type =
          'peaking';

        filter.frequency.value =
          eqBands[i];

        filter.Q.value =
          1;

        filter.gain.value =
          0;

        previousNode.connect(
          filter
        );

        previousNode =
          filter;

        eqFilters.push(
          filter
        );

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

      setStatus(
        'Audio processing could not be initialized.'
      );

    }

  }

  var equalizerPresets = {

    'Flat': [
      0,0,0,0,0,0,0,0,0
    ],

    'Bass Boost': [
      7,6,5,3,1,0,0,0,0
    ],

    'Treble Boost': [
      0,0,0,0,1,3,5,7,7
    ],

    'Vocal': [
      -2,-1,0,3,5,4,2,0,-1
    ],

    'Rock': [
      5,3,1,-1,-2,2,4,5,4
    ],

    'Pop': [
      -1,2,4,4,1,-1,-2,-2,-1
    ],

    'Jazz': [
      3,2,0,2,-1,-1,2,4,5
    ],

    'Classical': [
      4,3,2,0,-2,-1,2,4,5
    ],

    'Electronic': [
      6,4,1,0,-1,2,4,5,6
    ]

  };

  function applyEqualizer(
    name
  ) {

    if (!audioGraphReady) {
      initializeAudioGraph();
    }

    var preset =
      equalizerPresets[name];

    if (!preset) {
      return;
    }

    for (
      var i = 0;
      i < eqFilters.length;
      i++
    ) {

      eqFilters[i].gain.value =
        preset[i] || 0;

    }

    var options =
      document.querySelectorAll(
        '.appu-mp3-eq-option'
      );

    for (
      var j = 0;
      j < options.length;
      j++
    ) {

      options[j].classList.toggle(
        'appu-selected',
        options[j].getAttribute(
          'data-eq'
        ) === name
      );

    }

    eqButton.textContent =
      'EQ: ' + name;

    setStatus(
      'Equalizer: ' +
      name
    );

  }

  function resizeVisualizer() {

    var rect =
      canvas.getBoundingClientRect();

    var ratio =
      window.devicePixelRatio || 1;

    canvas.width =
      Math.max(
        1,
        Math.floor(
          rect.width * ratio
        )
      );

    canvas.height =
      Math.max(
        1,
        Math.floor(
          rect.height * ratio
        )
      );

    canvasContext.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

  }

  function drawVisualizer() {

    visualizerAnimation =
      requestAnimationFrame(
        drawVisualizer
      );

    var width =
      canvas.clientWidth;

    var height =
      canvas.clientHeight;

    if (
      !width ||
      !height
    ) {

      return;

    }

    canvasContext.clearRect(
      0,
      0,
      width,
      height
    );

    if (!analyser) {

      return;

    }

    var bufferLength =
      analyser.frequencyBinCount;

    var dataArray =
      new Uint8Array(
        bufferLength
      );

    analyser.getByteFrequencyData(
      dataArray
    );

    var bars =
      Math.min(
        42,
        Math.max(
          20,
          Math.floor(
            width / 9
          )
        )
      );

    var step =
      Math.max(
        1,
        Math.floor(
          bufferLength / bars
        )
      );

    var gap =
      3;

    var barWidth =
      Math.max(
        2,
        (width / bars) - gap
      );

    for (
      var i = 0;
      i < bars;
      i++
    ) {

      var total = 0;

      var count = 0;

      for (
        var j = 0;
        j < step;
        j++
      ) {

        var index =
          i * step + j;

        if (
          index < bufferLength
        ) {

          total +=
            dataArray[index];

          count++;

        }

      }

      var value =
        count
          ? total / count
          : 0;

      var normalized =
        value / 255;

      var barHeight =
        Math.max(
          4,
          normalized *
          height *
          .82
        );

      var x =
        i *
        (width / bars);

      var y =
        height -
        barHeight;

      canvasContext.fillStyle =
        'rgba(255,255,255,.84)';

      canvasContext.fillRect(
        x + gap / 2,
        y,
        barWidth,
        barHeight
      );

    }

  }

  function startVisualizer() {

    if (visualizerAnimation) {
      return;
    }

    resizeVisualizer();

    drawVisualizer();

  }

  window.addEventListener(
    'resize',
    resizeVisualizer
  );

  barButton.addEventListener(
    'click',
    function () {

      var visible =
        visualizer.classList.toggle(
          'appu-visible'
        );

      cover.style.display =
        visible
          ? 'none'
          : 'block';

      barButton.classList.toggle(
        'appu-active',
        visible
      );

      if (visible) {

        resizeVisualizer();

        initializeAudioGraph();

        setStatus(
          'Music Bar enabled.'
        );

      } else {

        setStatus(
          'Music Bar disabled.'
        );

      }

    }
  );

  function updateArtwork() {

    cover.classList.remove(
      'appu-has-artwork'
    );

    coverImage.removeAttribute(
      'src'
    );

    if (
      currentIndex < 0 ||
      !tracks[currentIndex]
    ) {

      return;

    }

    var track =
      tracks[currentIndex];

    if (
      track.artworkUrl
    ) {

      coverImage.src =
        track.artworkUrl;

      cover.classList.add(
        'appu-has-artwork'
      );

    }

  }

  coverImage.addEventListener(
    'error',
    function () {

      cover.classList.remove(
        'appu-has-artwork'
      );

    }
  );

  function createTrackUrl(
    track
  ) {

    if (!track.url) {

      track.url =
        URL.createObjectURL(
          track.file
        );

    }

    return track.url;

  }

  function addFiles(
    fileList
  ) {

    if (
      !fileList ||
      !fileList.length
    ) {

      return;

    }

    var addedTracks = [];

    for (
      var i = 0;
      i < fileList.length;
      i++
    ) {

      var file =
        fileList[i];

      if (!isAudioFile(file)) {
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

        file:
          file,

        name:
          cleanFileName(
            file.name
          ),

        title: '',

        artist: '',

        album: '',

        albumArtist: '',

        genre: '',

        year: '',

        track: '',

        disc: '',

        composer: '',

        comment: '',

        url: null,

        duration: 0,

        artworkUrl: null,

        artworkType: '',

        metadataLoaded: false

      };

      tracks.push(
        track
      );

      addedTracks.push(
        track
      );

    }

    if (
      addedTracks.length
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
        addedTracks.length +
        (
          addedTracks.length === 1
            ? ' audio file added. Reading ID3 metadata...'
            : ' audio files added. Reading ID3 metadata...'
        )
      );

      enrichTrackQueue(
        addedTracks,
        0
      );

    } else {

      setStatus(
        'No new supported audio files were added.'
      );

    }

    fileInput.value =
      '';

  }

  function enrichTrackQueue(
    list,
    index
  ) {

    if (
      index >= list.length
    ) {

      setStatus(
        list.length +
        (
          list.length === 1
            ? ' audio file ready.'
            : ' audio files ready.'
        )
      );

      return;

    }

    enrichTrack(
      list[index]
    );

    var wait =
      setInterval(
        function () {

          if (
            list[index].metadataLoaded
          ) {

            clearInterval(
              wait
            );

            enrichTrackQueue(
              list,
              index + 1
            );

          }

        },
        50
      );

  }

  scanButton.addEventListener(
    'click',
    function () {

      openModal(
        scanModal
      );

    }
  );

  var scanOptions =
    document.querySelectorAll(
      '.appu-mp3-scan-option'
    );

  for (
    var s = 0;
    s < scanOptions.length;
    s++
  ) {

    scanOptions[s].addEventListener(
      'click',
      function () {

        scanMin =
          Number(
            this.getAttribute(
              'data-scan-min'
            )
          ) || 0;

        scanMax =
          Number(
            this.getAttribute(
              'data-scan-max'
            )
          ) || 0;

        closeModal(
          scanModal
        );

        fileInput.click();

      }
    );

  }

  fileInput.addEventListener(
    'change',
    function () {

      if (
        !fileInput.files.length
      ) {

        return;

      }

      if (
        scanMin === 0 &&
        scanMax === 0
      ) {

        addFiles(
          fileInput.files
        );

        return;

      }

      scanFilesByDuration(
        fileInput.files
      );

    }
  );

  function scanFilesByDuration(
    fileList
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

      setStatus(
        'No supported audio files found.'
      );

      fileInput.value =
        '';

      return;

    }

    var checked =
      0;

    var matches =
      [];

    setStatus(
      'Scanning audio duration...'
    );

    for (
      var j = 0;
      j < files.length;
      j++
    ) {

      inspectAudioDuration(
        files[j],
        function (
          file,
          seconds
        ) {

          checked++;

          var valid =
            true;

          if (
            scanMin > 0 &&
            seconds <= scanMin
          ) {

            valid =
              false;

          }

          if (
            scanMax > 0 &&
            seconds >= scanMax
          ) {

            valid =
              false;

          }

          if (valid) {

            matches.push(
              file
            );

          }

          if (
            checked ===
            files.length
          ) {

            addFiles(
              matches
            );

            setStatus(
              matches.length +
              ' matching audio files found.'
            );

          }

        }
      );

    }

  }

  function inspectAudioDuration(
    file,
    callback
  ) {

    var probe =
      document.createElement(
        'audio'
      );

    var url =
      URL.createObjectURL(
        file
      );

    probe.preload =
      'metadata';

    probe.src =
      url;

    probe.addEventListener(
      'loadedmetadata',
      function () {

        var seconds =
          isFinite(
            probe.duration
          )
            ? probe.duration
            : 0;

        URL.revokeObjectURL(
          url
        );

        callback(
          file,
          seconds
        );

      }
    );

    probe.addEventListener(
      'error',
      function () {

        URL.revokeObjectURL(
          url
        );

        callback(
          file,
          0
        );

      }
    );

  }

  function loadTrack(
    index,
    autoplay
  ) {

    if (
      !tracks.length ||
      index < 0 ||
      index >= tracks.length
    ) {

      return;

    }

    currentIndex =
      index;

    var track =
      tracks[
        currentIndex
      ];

    currentUrl =
      createTrackUrl(
        track
      );

    audio.src =
      currentUrl;

    audio.load();

    updateCurrentTrackDisplay();

    progress.value =
      0;

    currentTime.textContent =
      '0:00';

    duration.textContent =
      '0:00';

    renderAllLibraries();

    updateMediaSession();

    if (autoplay) {

      initializeAudioGraph();

      if (
        audioContext &&
        audioContext.state ===
          'suspended'
      ) {

        audioContext.resume();

      }

      var promise =
        audio.play();

      if (
        promise &&
        typeof promise.catch ===
          'function'
      ) {

        promise.catch(
          function () {

            updatePlayButton();

          }
        );

      }

    }

    updatePlayButton();

  }

  function updateCurrentTrackDisplay() {

    if (
      currentIndex < 0 ||
      !tracks[currentIndex]
    ) {

      trackName.textContent =
        'No song selected';

      trackInfo.textContent =
        'Add music to start listening';

      updateArtwork();

      return;

    }

    var track =
      tracks[currentIndex];

    trackName.textContent =
      track.title ||
      track.name;

    var parts = [];

    if (
      track.artist
    ) {

      parts.push(
        track.artist
      );

    }

    if (
      track.album
    ) {

      parts.push(
        track.album
      );

    }

    if (
      track.year
    ) {

      parts.push(
        track.year
      );

    }

    if (
      !parts.length
    ) {

      parts.push(
        'Local music'
      );

    }

    trackInfo.textContent =
      parts.join(
        ' • '
      ) +
      ' • ' +
      (
        currentIndex + 1
      ) +
      ' of ' +
      tracks.length;

    updateArtwork();

  }

  playButton.addEventListener(
    'click',
    togglePlay
  );

  function togglePlay() {

    if (!tracks.length) {

      openModal(
        scanModal
      );

      return;

    }

    initializeAudioGraph();

    if (
      audioContext &&
      audioContext.state ===
        'suspended'
    ) {

      audioContext.resume();

    }

    if (
      currentIndex === -1
    ) {

      loadTrack(
        0,
        true
      );

      return;

    }

    if (audio.paused) {

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
              'The browser could not start playback.'
            );

          }
        );

      }

    } else {

      audio.pause();

    }

  }

  function updatePlayButton() {

    if (!audio.paused) {

      playButton.textContent =
        '||';

      root.classList.add(
        'appu-mp3-playing'
      );

    } else {

      playButton.textContent =
        '>';

      root.classList.remove(
        'appu-mp3-playing'
      );

    }

  }

  prevButton.addEventListener(
    'click',
    previousTrack
  );

  nextButton.addEventListener(
    'click',
    nextTrack
  );

  function nextTrack() {

    if (!tracks.length) {
      return;
    }

    var nextIndex;

    if (
      isShuffle &&
      tracks.length > 1
    ) {

      do {

        nextIndex =
          Math.floor(
            Math.random() *
            tracks.length
          );

      } while (
        nextIndex ===
        currentIndex
      );

    } else {

      nextIndex =
        currentIndex + 1;

      if (
        nextIndex >=
        tracks.length
      ) {

        nextIndex = 0;

      }

    }

    loadTrack(
      nextIndex,
      true
    );

  }

  function previousTrack() {

    if (!tracks.length) {
      return;
    }

    if (
      audio.currentTime > 3
    ) {

      audio.currentTime =
        0;

      return;

    }

    var previousIndex =
      currentIndex - 1;

    if (
      previousIndex < 0
    ) {

      previousIndex =
        tracks.length - 1;

    }

    loadTrack(
      previousIndex,
      true
    );

  }

  progress.addEventListener(
    'input',
    function () {

      if (
        !isFinite(
          audio.duration
        )
      ) {

        return;

      }

      audio.currentTime =
        (
          Number(
            progress.value
          ) / 100
        ) *
        audio.duration;

    }
  );

  audio.addEventListener(
    'timeupdate',
    function () {

      if (
        isFinite(
          audio.duration
        ) &&
        audio.duration > 0
      ) {

        progress.value =
          (
            audio.currentTime /
            audio.duration
          ) *
          100;

      }

      currentTime.textContent =
        formatTime(
          audio.currentTime
        );

      updateMediaPosition();

    }
  );

  audio.addEventListener(
    'loadedmetadata',
    function () {

      duration.textContent =
        formatTime(
          audio.duration
        );

      if (
        currentIndex >= 0 &&
        tracks[currentIndex]
      ) {

        tracks[
          currentIndex
        ].duration =
          audio.duration;

      }

      renderAllLibraries();

      updateMediaSession();

    }
  );

  backButton.addEventListener(
    'click',
    function () {

      audio.currentTime =
        Math.max(
          0,
          audio.currentTime - 10
        );

    }
  );

  forwardButton.addEventListener(
    'click',
    function () {

      audio.currentTime =
        Math.min(
          audio.duration || Infinity,
          audio.currentTime + 10
        );

    }
  );

  audio.addEventListener(
    'ended',
    function () {

      if (
        repeatMode === 2
      ) {

        audio.currentTime =
          0;

        var repeatPromise =
          audio.play();

        if (
          repeatPromise &&
          typeof repeatPromise.catch ===
            'function'
        ) {

          repeatPromise.catch(
            function () {}
          );

        }

        return;

      }

      if (
        repeatMode === 1 ||
        currentIndex <
          tracks.length - 1 ||
        isShuffle
      ) {

        nextTrack();

        return;

      }

      audio.currentTime =
        0;

      updatePlayButton();

      updateMediaPlaybackState();

    }
  );

  shuffleButton.addEventListener(
    'click',
    function () {

      isShuffle =
        !isShuffle;

      shuffleButton.classList.toggle(
        'appu-active',
        isShuffle
      );

      shuffleButton.textContent =
        isShuffle
          ? 'Shuffle: On'
          : 'Shuffle';

      setStatus(
        isShuffle
          ? 'Shuffle enabled.'
          : 'Shuffle disabled.'
      );

    }
  );

  repeatButton.addEventListener(
    'click',
    function () {

      repeatMode++;

      if (
        repeatMode > 2
      ) {

        repeatMode = 0;

      }

      if (
        repeatMode === 0
      ) {

        repeatButton.textContent =
          'Repeat: Off';

        repeatButton.classList.remove(
          'appu-active'
        );

      }

      if (
        repeatMode === 1
      ) {

        repeatButton.textContent =
          'Repeat: All';

        repeatButton.classList.add(
          'appu-active'
        );

      }

      if (
        repeatMode === 2
      ) {

        repeatButton.textContent =
          'Repeat: This Song';

        repeatButton.classList.add(
          'appu-active'
        );

      }

    }
  );

  volume.addEventListener(
    'input',
    function () {

      audio.volume =
        Number(
          volume.value
        );

      if (
        audio.volume > 0
      ) {

        volumeBeforeMute =
          audio.volume;

      }

      updateVolumeIcon();

    }
  );

  volumeIcon.addEventListener(
    'click',
    function () {

      if (
        audio.volume > 0
      ) {

        volumeBeforeMute =
          audio.volume;

        audio.volume =
          0;

        volume.value =
          0;

      } else {

        audio.volume =
          volumeBeforeMute || 1;

        volume.value =
          audio.volume;

      }

      updateVolumeIcon();

    }
  );

  function updateVolumeIcon() {

    volumeIcon.textContent =
      audio.volume === 0
        ? 'Mute'
        : 'Vol';

  }

  eqButton.addEventListener(
    'click',
    function () {

      openModal(
        eqModal
      );

    }
  );

  var eqOptions =
    document.querySelectorAll(
      '.appu-mp3-eq-option'
    );

  for (
    var e = 0;
    e < eqOptions.length;
    e++
  ) {

    eqOptions[e].addEventListener(
      'click',
      function () {

        var name =
          this.getAttribute(
            'data-eq'
          );

        initializeAudioGraph();

        applyEqualizer(
          name
        );

        closeModal(
          eqModal
        );

      }
    );

  }

  var closeButtons =
    document.querySelectorAll(
      '[data-close-modal]'
    );

  for (
    var c = 0;
    c < closeButtons.length;
    c++
  ) {

    closeButtons[c].addEventListener(
      'click',
      function () {

        var target =
          this.getAttribute(
            'data-close-modal'
          );

        if (
          target === 'scan'
        ) {

          closeModal(
            scanModal
          );

        }

        if (
          target === 'eq'
        ) {

          closeModal(
            eqModal
          );

        }

      }
    );

  }

  scanModal.addEventListener(
    'click',
    function (event) {

      if (
        event.target ===
        scanModal
      ) {

        closeModal(
          scanModal
        );

      }

    }
  );

  eqModal.addEventListener(
    'click',
    function (event) {

      if (
        event.target ===
        eqModal
      ) {

        closeModal(
          eqModal
        );

      }

    }
  );

  document.addEventListener(
    'keydown',
    function (event) {

      if (
        event.key ===
        'Escape'
      ) {

        closeModal(
          scanModal
        );

        closeModal(
          eqModal
        );

      }

    }
  );

  function renderPlaylist() {

    playlistElement.innerHTML =
      '';

    if (!tracks.length) {

      playlistElement.innerHTML =
        '<div class="appu-mp3-empty">' +
        'Your selected songs will appear here.' +
        '</div>';

      return;

    }

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      createTrackElement(
        playlistElement,
        i
      );

    }

  }

  function createTrackElement(
    container,
    index
  ) {

    var track =
      tracks[index];

    var item =
      document.createElement(
        'div'
      );

    item.className =
      'appu-mp3-item';

    if (
      index === currentIndex
    ) {

      item.classList.add(
        'appu-current'
      );

    }

    var number =
      document.createElement(
        'div'
      );

    number.className =
      'appu-mp3-item-number';

    number.textContent =
      index + 1;

    var icon =
      document.createElement(
        'div'
      );

    icon.className =
      'appu-mp3-item-icon';

    if (
      track.artworkUrl
    ) {

      var iconImage =
        document.createElement(
          'img'
        );

      iconImage.alt =
        '';

      iconImage.src =
        track.artworkUrl;

      icon.appendChild(
        iconImage
      );

    } else {

      icon.textContent =
        (
          index === currentIndex &&
          !audio.paused
        )
          ? '||'
          : 'Music';

    }

    var info =
      document.createElement(
        'div'
      );

    info.className =
      'appu-mp3-item-info';

    var name =
      document.createElement(
        'div'
      );

    name.className =
      'appu-mp3-item-name';

    name.textContent =
      track.title ||
      track.name;

    var meta =
      document.createElement(
        'div'
      );

    meta.className =
      'appu-mp3-item-meta';

    var metaParts = [];

    if (
      track.artist
    ) {

      metaParts.push(
        track.artist
      );

    }

    if (
      track.album
    ) {

      metaParts.push(
        track.album
      );

    }

    if (
      track.duration &&
      isFinite(
        track.duration
      )
    ) {

      metaParts.push(
        formatTime(
          track.duration
        )
      );

    }

    if (
      !metaParts.length
    ) {

      metaParts.push(
        getExtension(
          track.file.name
        ).toUpperCase() ||
        'AUDIO'
      );

    }

    meta.textContent =
      metaParts.join(
        ' • '
      );

    info.appendChild(
      name
    );

    info.appendChild(
      meta
    );

    var remove =
      document.createElement(
        'button'
      );

    remove.className =
      'appu-mp3-item-remove';

    remove.type =
      'button';

    remove.setAttribute(
      'aria-label',
      'Remove ' +
      (
        track.title ||
        track.name
      )
    );

    remove.textContent =
      'x';

    remove.addEventListener(
      'click',
      function (event) {

        event.stopPropagation();

        removeTrack(
          index
        );

      }
    );

    item.appendChild(
      number
    );

    item.appendChild(
      icon
    );

    item.appendChild(
      info
    );

    item.appendChild(
      remove
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

    container.appendChild(
      item
    );

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

    var wasCurrent =
      index === currentIndex;

    var removed =
      tracks[index];

    if (
      removed.url
    ) {

      URL.revokeObjectURL(
        removed.url
      );

      removed.url =
        null;

    }

    if (
      removed.artworkUrl
    ) {

      URL.revokeObjectURL(
        removed.artworkUrl
      );

      removed.artworkUrl =
        null;

    }

    tracks.splice(
      index,
      1
    );

    if (!tracks.length) {

      audio.pause();

      audio.removeAttribute(
        'src'
      );

      audio.load();

      currentIndex =
        -1;

      currentUrl =
        '';

      trackName.textContent =
        'No song selected';

      trackInfo.textContent =
        'Add music to start listening';

      progress.value =
        0;

      currentTime.textContent =
        '0:00';

      duration.textContent =
        '0:00';

      updateArtwork();

      updatePlayButton();

      renderAllLibraries();

      return;

    }

    if (
      index < currentIndex
    ) {

      currentIndex--;

    } else if (
      wasCurrent
    ) {

      if (
        index >= tracks.length
      ) {

        currentIndex =
          tracks.length - 1;

      }

      loadTrack(
        currentIndex,
        false
      );

    }

    renderAllLibraries();

  }

  function renderAllLibraries() {

    renderPlaylist();

    renderSongs();

    renderCategories(
      genreList,
      'genre',
      'Genre'
    );

    renderCategories(
      albumList,
      'album',
      'Album'
    );

    renderCategories(
      artistList,
      'artist',
      'Artist'
    );

  }

  function renderSongs() {

    songList.innerHTML =
      '';

    if (!tracks.length) {

      songList.innerHTML =
        '<div class="appu-mp3-empty">' +
        'No songs available.' +
        '</div>';

      return;

    }

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      createTrackElement(
        songList,
        i
      );

    }

  }

  function renderCategories(
    container,
    field,
    label
  ) {

    container.innerHTML =
      '';

    if (!tracks.length) {

      container.innerHTML =
        '<div class="appu-mp3-empty">' +
        'No ' +
        label.toLowerCase() +
        ' information available.' +
        '</div>';

      return;

    }

    var groups = {};

    for (
      var i = 0;
      i < tracks.length;
      i++
    ) {

      var value =
        tracks[i][field] ||
        'Unknown';

      if (
        !groups[value]
      ) {

        groups[value] = [];

      }

      groups[value].push(
        i
      );

    }

    var names =
      Object.keys(
        groups
      );

    names.sort(
      function (a,b) {

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

      createCategoryElement(
        container,
        names[j],
        groups[
          names[j]
        ],
        label
      );

    }

  }

  function createCategoryElement(
    container,
    name,
    indexes,
    label
  ) {

    var item =
      document.createElement(
        'div'
      );

    item.className =
      'appu-mp3-category-item';

    var icon =
      document.createElement(
        'div'
      );

    icon.className =
      'appu-mp3-category-icon';

    icon.textContent =
      label;

    var info =
      document.createElement(
        'div'
      );

    info.className =
      'appu-mp3-category-info';

    var title =
      document.createElement(
        'div'
      );

    title.className =
      'appu-mp3-category-name';

    title.textContent =
      name;

    var count =
      document.createElement(
        'div'
      );

    count.className =
      'appu-mp3-category-count';

    count.textContent =
      indexes.length +
      (
        indexes.length === 1
          ? ' song'
          : ' songs'
      );

    info.appendChild(
      title
    );

    info.appendChild(
      count
    );

    item.appendChild(
      icon
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

    container.appendChild(
      item
    );

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

    if ('serviceWorker' in navigator) {

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
