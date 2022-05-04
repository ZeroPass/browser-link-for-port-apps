'use strict';

document.head.innerHTML += '<meta content="width=device-width, initial-scale=1" name="viewport">';

//load fonts
function addStylesheetURL(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  
  // Load Tangerine & Cantarell
  addStylesheetURL('https://fonts.googleapis.com/css2?family=Ubuntu&family=italic&display=swap');

/**
    The start of 'qr-creator' library.
    *Make sure that libary is hosted on same server as page (CORS related reason).
**/

let qrCodeGenerator = null;

// Library interface
/*export default*/ class QrCreator {
    static render(config, $element) {
        qrCodeGenerator(config, $element);
    }
}
// avoid that closure compiler strips these away
QrCreator['render'] = QrCreator.render;
self['QrCreator'] = QrCreator;


/*! jquery-qrcode v0.14.0 - https://larsjung.de/jquery-qrcode/ */
(function (vendor_qrcode) {

    // Wrapper for the original QR code generator.
    function createQRCode(text, level, version, quiet) {
        var qr = {};

        var vqr = vendor_qrcode(version, level);
        vqr.addData(text);
        vqr.make();

        quiet = quiet || 0;

        var qrModuleCount = vqr.getModuleCount(),
            quietModuleCount = vqr.getModuleCount() + 2 * quiet;

        function isDark(row, col) {
            row -= quiet;
            col -= quiet;

            if (row < 0 || row >= qrModuleCount || col < 0 || col >= qrModuleCount) {
                return false;
            }
            return vqr.isDark(row, col);
        }

        qr.text = text;
        qr.level = level;
        qr.version = version;
        qr.moduleCount = quietModuleCount;
        qr.isDark = isDark;
        //        qr.addBlank = addBlank;

        return qr;
    }

    // Returns a minimal QR code for the given text starting with version `minVersion`.
    // Returns `undefined` if `text` is too long to be encoded in `maxVersion`.
    function createMinQRCode(text, level, minVersion, maxVersion, quiet) {
        minVersion = Math.max(1, minVersion || 1);
        maxVersion = Math.min(40, maxVersion || 40);
        for (var version = minVersion; version <= maxVersion; version += 1) {
            try {
                return createQRCode(text, level, version, quiet);
            } catch (err) { }
        }
        return undefined;
    }

    function drawBackground(qr, context, settings) {
        if (settings.background) {
            context.fillStyle = settings.background;
            context.fillRect(settings.left, settings.top, settings.size, settings.size);
        }
    }

    // used when center is filled
    function drawModuleRoundedDark(ctx, l, t, r, b, rad, nw, ne, se, sw) {
        //let moveTo = (x, y) => ctx.moveTo(Math.floor(x), Math.floor(y));
        if (nw) {
            ctx.moveTo(l + rad, t);
        } else {
            ctx.moveTo(l, t);
        }

        function lal(b, x0, y0, x1, y1, r0, r1) {
            if (b) {
                ctx.lineTo(x0 + r0, y0 + r1);
                ctx.arcTo(x0, y0, x1, y1, rad);
            } else {
                ctx.lineTo(x0, y0);
            }
        }

        lal(ne, r, t, r, b, -rad, 0);
        lal(se, r, b, l, b, 0, -rad);
        lal(sw, l, b, l, t, rad, 0);
        lal(nw, l, t, r, t, 0, rad);
    }

    // used when center is empty
    function drawModuleRoundendLight(ctx, l, t, r, b, rad, nw, ne, se, sw) {
        function mlla(x, y, r0, r1) {
            ctx.moveTo(x + r0, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, y + r1);
            ctx.arcTo(x, y, x + r0, y, rad);
        }

        if (nw) mlla(l, t, rad, rad);
        if (ne) mlla(r, t, -rad, rad);
        if (se) mlla(r, b, -rad, -rad);
        if (sw) mlla(l, b, rad, -rad);
    }

    function drawModuleRounded(qr, context, settings, left, top, width, row, col) {
        var isDark = qr.isDark,
            right = left + width,
            bottom = top + width,
            rowT = row - 1,
            rowB = row + 1,
            colL = col - 1,
            colR = col + 1,
            radius = Math.floor(Math.min(0.5, Math.max(0, settings.radius)) * width),
            center = isDark(row, col),
            northwest = isDark(rowT, colL),
            north = isDark(rowT, col),
            northeast = isDark(rowT, colR),
            east = isDark(row, colR),
            southeast = isDark(rowB, colR),
            south = isDark(rowB, col),
            southwest = isDark(rowB, colL),
            west = isDark(row, colL);

        left = Math.round(left);
        top = Math.round(top);
        right = Math.round(right);
        bottom = Math.round(bottom);

        if (center) {
            drawModuleRoundedDark(context, left, top, right, bottom, radius, !north && !west, !north && !east, !south && !east, !south && !west);
        } else {
            drawModuleRoundendLight(context, left, top, right, bottom, radius, north && west && northwest, north && east && northeast, south && east && southeast, south && west && southwest);
        }
    }

    function drawModules(qr, context, settings) {
        var moduleCount = qr.moduleCount,
            moduleSize = settings.size / moduleCount,
            row,
            col;

        context.beginPath();
        for (row = 0; row < moduleCount; row += 1) {
            for (col = 0; col < moduleCount; col += 1) {
                var l = settings.left + col * moduleSize,
                    t = settings.top + row * moduleSize,
                    w = moduleSize;

                drawModuleRounded(qr, context, settings, l, t, w, row, col);
            }
        }

        setFill(context, settings);
        context.fill();
    }

    function setFill(context, settings) {
        const fill = settings.fill;
        if (typeof fill === 'string') {
            // solid color
            context.fillStyle = fill;
            return;
        }
        const type = fill['type'],
            position = fill['position'],
            colorStops = fill['colorStops'];
        let gradient;
        const absolutePosition = position.map(coordinate => Math.round(coordinate * settings.size));
        if (type === 'linear-gradient') {
            gradient = context.createLinearGradient.apply(context, absolutePosition);
        } else if (type === 'radial-gradient') {
            gradient = context.createRadialGradient.apply(context, absolutePosition);
        } else {
            throw new Error('Unsupported fill');
        }
        colorStops.forEach(([offset, color]) => {
            gradient.addColorStop(offset, color);
        });
        context.fillStyle = gradient;
    }

    // Draws QR code to the given `canvas` and returns it.
    function drawOnCanvas(canvas, settings) {
        var qr = createMinQRCode(settings.text, settings.ecLevel, settings.minVersion, settings.maxVersion, settings.quiet);
        if (!qr) {
            return null;
        }

        var context = canvas.getContext('2d');

        drawBackground(qr, context, settings);
        drawModules(qr, context, settings);

        return canvas;
    }

    // Returns a `canvas` element representing the QR code for the given settings.
    function createCanvas(settings) {
        var $canvas = document.createElement('canvas');
        $canvas.width = settings.size;
        $canvas.height = settings.size;
        return drawOnCanvas($canvas, settings);
    }

    // Plugin
    // ======

    // Default settings
    // ----------------
    var defaults = {
        // version range somewhere in 1 .. 40
        'minVersion': 1,
        'maxVersion': 40,

        // error correction level: `'L'`, `'M'`, `'Q'` or `'H'`
        'ecLevel': 'L',

        // offset in pixel if drawn onto existing canvas
        'left': 0,
        'top': 0,

        // size in pixel
        'size': 200,

        // code color or image element
        'fill': '#000',

        // background color, `null` for transparent background
        'background': null,

        // content
        'text': 'no text',

        // corner radius relative to module width: 0.0 .. 0.5
        'radius': 0.5,

        // quiet zone in modules
        'quiet': 0,

    };

    // // Register the plugin
    // // -------------------
    qrCodeGenerator = function (options, $element) {
        var settings = {};
        Object.assign(settings, defaults, options);
        // map real names to minifyable properties used by closure compiler
        settings.minVersion = settings['minVersion'];
        settings.maxVersion = settings['maxVersion'];
        settings.ecLevel = settings['ecLevel'];
        settings.left = settings['left'];
        settings.top = settings['top'];
        settings.size = settings['size'];
        settings.fill = settings['fill'];
        settings.background = settings['background'];
        settings.text = settings['text'];
        settings.radius = settings['radius'];
        settings.quiet = settings['quiet'];

        if ($element instanceof HTMLCanvasElement) {
            if ($element.width !== settings.size || $element.height !== settings.size) {
                $element.width = settings.size;
                $element.height = settings.size;
            }
            $element.getContext('2d').clearRect(0, 0, $element.width, $element.height);
            drawOnCanvas($element, settings);
        } else {
            const $canvas = createCanvas(settings);
            $element.appendChild($canvas);
        }
    };
}(function () {
    // `qrcode` is the single public function defined by the `QR Code Generator`
    //---------------------------------------------------------------------
    //
    // QR Code Generator for JavaScript
    //
    // Copyright (c) 2009 Kazuhiko Arase
    //
    // URL: http://www.d-project.com/
    //
    // Licensed under the MIT license:
    //  http://www.opensource.org/licenses/mit-license.php
    //
    // The word 'QR Code' is registered trademark of
    // DENSO WAVE INCORPORATED
    //  http://www.denso-wave.com/qrcode/faqpatent-e.html
    //
    //---------------------------------------------------------------------

    var qrcode = function () {

        //---------------------------------------------------------------------
        // qrcode
        //---------------------------------------------------------------------

        /**
         * qrcode
         * @param typeNumber 1 to 40
         * @param errorCorrectLevel 'L','M','Q','H'
         */
        var qrcode = function (typeNumber, errorCorrectLevel) {

            var PAD0 = 0xEC,
                PAD1 = 0x11,
                _typeNumber = typeNumber,
                _errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel],
                _modules = null,
                _moduleCount = 0,
                _dataCache = null,
                _dataList = new Array(),
                _this = {},
                makeImpl = function (test, maskPattern) {

                    _moduleCount = _typeNumber * 4 + 17;
                    _modules = function (moduleCount) {
                        var modules = new Array(moduleCount);
                        for (var row = 0; row < moduleCount; row += 1) {
                            modules[row] = new Array(moduleCount);
                            for (var col = 0; col < moduleCount; col += 1) {
                                modules[row][col] = null;
                            }
                        }
                        return modules;
                    }(_moduleCount);

                    setupPositionProbePattern(0, 0);
                    setupPositionProbePattern(_moduleCount - 7, 0);
                    setupPositionProbePattern(0, _moduleCount - 7);
                    setupPositionAdjustPattern();
                    setupTimingPattern();
                    setupTypeInfo(test, maskPattern);

                    if (_typeNumber >= 7) {
                        setupTypeNumber(test);
                    }

                    if (_dataCache == null) {
                        _dataCache = createData(_typeNumber, _errorCorrectLevel, _dataList);
                    }

                    mapData(_dataCache, maskPattern);
                },

                setupPositionProbePattern = function (row, col) {

                    for (var r = -1; r <= 7; r += 1) {

                        if (row + r <= -1 || _moduleCount <= row + r) continue;

                        for (var c = -1; c <= 7; c += 1) {

                            if (col + c <= -1 || _moduleCount <= col + c) continue;

                            if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
                                (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
                                (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                                _modules[row + r][col + c] = true;
                            } else {
                                _modules[row + r][col + c] = false;
                            }
                        }
                    }
                },

                getBestMaskPattern = function () {

                    var minLostPoint = 0,
                        pattern = 0;

                    for (var i = 0; i < 8; i += 1) {

                        makeImpl(true, i);

                        var lostPoint = QRUtil.getLostPoint(_this);

                        if (i == 0 || minLostPoint > lostPoint) {
                            minLostPoint = lostPoint;
                            pattern = i;
                        }
                    }

                    return pattern;
                },

                setupTimingPattern = function () {

                    for (var r = 8; r < _moduleCount - 8; r += 1) {
                        if (_modules[r][6] != null) {
                            continue;
                        }
                        _modules[r][6] = (r % 2 == 0);
                    }

                    for (var c = 8; c < _moduleCount - 8; c += 1) {
                        if (_modules[6][c] != null) {
                            continue;
                        }
                        _modules[6][c] = (c % 2 == 0);
                    }
                },

                setupPositionAdjustPattern = function () {

                    var pos = QRUtil.getPatternPosition(_typeNumber);

                    for (var i = 0; i < pos.length; i += 1) {

                        for (var j = 0; j < pos.length; j += 1) {

                            var row = pos[i];
                            var col = pos[j];

                            if (_modules[row][col] != null) {
                                continue;
                            }

                            for (var r = -2; r <= 2; r += 1) {

                                for (var c = -2; c <= 2; c += 1) {

                                    _modules[row + r][col + c] = r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0);
                                }
                            }
                        }
                    }
                },

                // TODO rm5 can be removed if we fix type to 5 (this method is called at 7 only)
                setupTypeNumber = function (test) {

                    var bits = QRUtil.getBCHTypeNumber(_typeNumber);

                    for (var i = 0; i < 18; i += 1) {
                        var mod = (!test && ((bits >> i) & 1) == 1);
                        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
                    }

                    for (var i = 0; i < 18; i += 1) {
                        var mod = (!test && ((bits >> i) & 1) == 1);
                        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
                    }
                },

                setupTypeInfo = function (test, maskPattern) {

                    var data = (_errorCorrectLevel << 3) | maskPattern;
                    var bits = QRUtil.getBCHTypeInfo(data);

                    for (var i = 0; i < 15; i += 1) {
                        let mod = (!test && ((bits >> i) & 1) == 1);

                        // vertical then horizontal
                        _modules[i < 6 ? i : (i < 8 ? i + 1 : _moduleCount - 15 + i)][8] = mod;
                        _modules[8][i < 8 ? _moduleCount - i - 1 : (i < 9 ? 15 - i : 14 - i)] = mod;
                    }

                    // fixed module
                    _modules[_moduleCount - 8][8] = (!test);
                },

                mapData = function (data, maskPattern) {

                    var inc = -1,
                        row = _moduleCount - 1,
                        bitIndex = 7,
                        byteIndex = 0,
                        maskFunc = QRUtil.getMaskFunction(maskPattern);

                    for (var col = _moduleCount - 1; col > 0; col -= 2) {

                        if (col == 6) col -= 1;

                        while (true) {

                            for (var c = 0; c < 2; c += 1) {

                                if (_modules[row][col - c] == null) {

                                    var dark = false;

                                    if (byteIndex < data.length) {
                                        dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
                                    }

                                    var mask = maskFunc(row, col - c);

                                    if (mask) {
                                        dark = !dark;
                                    }

                                    _modules[row][col - c] = dark;
                                    bitIndex -= 1;

                                    if (bitIndex == -1) {
                                        byteIndex += 1;
                                        bitIndex = 7;
                                    }
                                }
                            }

                            row += inc;

                            if (row < 0 || _moduleCount <= row) {
                                row -= inc;
                                inc = -inc;
                                break;
                            }
                        }
                    }
                },

                createBytes = function (buffer, rsBlocks) {

                    var offset = 0,
                        maxDcCount = 0,
                        maxEcCount = 0,
                        dcdata = new Array(rsBlocks.length),
                        ecdata = new Array(rsBlocks.length);

                    for (var r = 0; r < rsBlocks.length; r += 1) {

                        var dcCount = rsBlocks[r].dataCount,
                            ecCount = rsBlocks[r].totalCount - dcCount;

                        maxDcCount = Math.max(maxDcCount, dcCount);
                        maxEcCount = Math.max(maxEcCount, ecCount);

                        dcdata[r] = new Array(dcCount);

                        for (var i = 0; i < dcdata[r].length; i += 1) {
                            dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
                        }
                        offset += dcCount;

                        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount),
                            rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1),
                            modPoly = rawPoly.mod(rsPoly);

                        ecdata[r] = new Array(rsPoly.getLength() - 1);
                        for (var i = 0; i < ecdata[r].length; i += 1) {
                            var modIndex = i + modPoly.getLength() - ecdata[r].length;
                            ecdata[r][i] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0;
                        }
                    }

                    var totalCodeCount = 0;
                    for (var i = 0; i < rsBlocks.length; i += 1) {
                        totalCodeCount += rsBlocks[i].totalCount;
                    }

                    var data = new Array(totalCodeCount);
                    var index = 0;

                    for (var i = 0; i < maxDcCount; i += 1) {
                        for (var r = 0; r < rsBlocks.length; r += 1) {
                            if (i < dcdata[r].length) {
                                data[index] = dcdata[r][i];
                                index += 1;
                            }
                        }
                    }

                    for (var i = 0; i < maxEcCount; i += 1) {
                        for (var r = 0; r < rsBlocks.length; r += 1) {
                            if (i < ecdata[r].length) {
                                data[index] = ecdata[r][i];
                                index += 1;
                            }
                        }
                    }

                    return data;
                },

                createData = function (typeNumber, errorCorrectLevel, dataList) {

                    var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel),
                        buffer = qrBitBuffer();

                    for (var i = 0; i < dataList.length; i += 1) {
                        var data = dataList[i];
                        buffer.put(data.getMode(), 4);
                        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber));
                        data.write(buffer);
                    }

                    // calc num max data.
                    var totalDataCount = 0;
                    for (var i = 0; i < rsBlocks.length; i += 1) {
                        totalDataCount += rsBlocks[i].dataCount;
                    }

                    if (buffer.getLengthInBits() > totalDataCount * 8) {
                        throw new Error('code length overflow. (' +
                            buffer.getLengthInBits() +
                            '>' +
                            totalDataCount * 8 +
                            ')');
                    }

                    // end code
                    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
                        buffer.put(0, 4);
                    }

                    // padding
                    while (buffer.getLengthInBits() % 8 != 0) {
                        buffer.putBit(false);
                    }

                    // padding
                    while (true) {

                        if (buffer.getLengthInBits() >= totalDataCount * 8) {
                            break;
                        }
                        buffer.put(PAD0, 8);

                        if (buffer.getLengthInBits() >= totalDataCount * 8) {
                            break;
                        }
                        buffer.put(PAD1, 8);
                    }

                    return createBytes(buffer, rsBlocks);
                };

            _this.addData = function (data) {
                var newData = qr8BitByte(data);
                _dataList.push(newData);
                _dataCache = null;
            };

            _this.isDark = function (row, col) {
                if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
                    throw new Error(row + ',' + col);
                }
                return _modules[row][col];
            };

            _this.getModuleCount = function () {
                return _moduleCount;
            };

            _this.make = function () {
                makeImpl(false, getBestMaskPattern());
            };

            return _this;
        };

        //---------------------------------------------------------------------
        // qrcode.stringToBytes
        //---------------------------------------------------------------------

        // UTF-8 version
        qrcode.stringToBytes = function (s) {
            // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
            function toUTF8Array(str) {
                var utf8 = [];
                for (var i = 0; i < str.length; i++) {
                    var charcode = str.charCodeAt(i);
                    if (charcode < 0x80) utf8.push(charcode);
                    else if (charcode < 0x800) {
                        utf8.push(0xc0 | (charcode >> 6),
                            0x80 | (charcode & 0x3f));
                    } else if (charcode < 0xd800 || charcode >= 0xe000) {
                        utf8.push(0xe0 | (charcode >> 12),
                            0x80 | ((charcode >> 6) & 0x3f),
                            0x80 | (charcode & 0x3f));
                    }
                    // surrogate pair
                    else {
                        i++;
                        // UTF-16 encodes 0x10000-0x10FFFF by
                        // subtracting 0x10000 and splitting the
                        // 20 bits of 0x0-0xFFFFF into two halves
                        charcode = 0x10000 + (((charcode & 0x3ff) << 10) |
                            (str.charCodeAt(i) & 0x3ff));
                        utf8.push(0xf0 | (charcode >> 18),
                            0x80 | ((charcode >> 12) & 0x3f),
                            0x80 | ((charcode >> 6) & 0x3f),
                            0x80 | (charcode & 0x3f));
                    }
                }
                return utf8;
            }
            return toUTF8Array(s);
        };

        //---------------------------------------------------------------------
        // QRMode
        //---------------------------------------------------------------------

        var QRMode = {
            MODE_8BIT_BYTE: 1 << 2,
        };

        //---------------------------------------------------------------------
        // QRErrorCorrectLevel
        //---------------------------------------------------------------------

        var QRErrorCorrectLevel = {
            'L': 1,
            'M': 0,
            'Q': 3,
            'H': 2
        };

        //---------------------------------------------------------------------
        // QRMaskPattern
        //---------------------------------------------------------------------

        var QRMaskPattern = {
            PATTERN000: 0,
            PATTERN001: 1,
            PATTERN010: 2,
            PATTERN011: 3,
            PATTERN100: 4,
            PATTERN101: 5,
            PATTERN110: 6,
            PATTERN111: 7
        };

        //---------------------------------------------------------------------
        // QRUtil
        //---------------------------------------------------------------------

        var QRUtil = function () {

            var PATTERN_POSITION_TABLE = [
                [],
                [6, 18],
                [6, 22],
                [6, 26],
                [6, 30],
                [6, 34],
                [6, 22, 38],
                [6, 24, 42],
                [6, 26, 46],
                [6, 28, 50],
                [6, 30, 54],
                [6, 32, 58],
                [6, 34, 62],
                [6, 26, 46, 66],
                [6, 26, 48, 70],
                [6, 26, 50, 74],
                [6, 30, 54, 78],
                [6, 30, 56, 82],
                [6, 30, 58, 86],
                [6, 34, 62, 90],
                [6, 28, 50, 72, 94],
                [6, 26, 50, 74, 98],
                [6, 30, 54, 78, 102],
                [6, 28, 54, 80, 106],
                [6, 32, 58, 84, 110],
                [6, 30, 58, 86, 114],
                [6, 34, 62, 90, 118],
                [6, 26, 50, 74, 98, 122],
                [6, 30, 54, 78, 102, 126],
                [6, 26, 52, 78, 104, 130],
                [6, 30, 56, 82, 108, 134],
                [6, 34, 60, 86, 112, 138],
                [6, 30, 58, 86, 114, 142],
                [6, 34, 62, 90, 118, 146],
                [6, 30, 54, 78, 102, 126, 150],
                [6, 24, 50, 76, 102, 128, 154],
                [6, 28, 54, 80, 106, 132, 158],
                [6, 32, 58, 84, 110, 136, 162],
                [6, 26, 54, 82, 110, 138, 166],
                [6, 30, 58, 86, 114, 142, 170]
            ],
                G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
                G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
                G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),

                _this = {},

                getBCHDigit = function (data) {
                    var digit = 0;
                    while (data != 0) {
                        digit += 1;
                        data >>>= 1;
                    }
                    return digit;
                };

            _this.getBCHTypeInfo = function (data) {
                var d = data << 10;
                while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
                    d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
                }
                return ((data << 10) | d) ^ G15_MASK;
            };

            // TODO rm5 (see rm5 above)
            _this.getBCHTypeNumber = function (data) {
                var d = data << 12;
                while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
                    d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
                }
                return (data << 12) | d;
            };

            _this.getPatternPosition = function (typeNumber) {
                return PATTERN_POSITION_TABLE[typeNumber - 1];
            };

            _this.getMaskFunction = function (maskPattern) {

                switch (maskPattern) {

                    case QRMaskPattern.PATTERN000:
                        return function (i, j) { return (i + j) % 2 == 0; };
                    case QRMaskPattern.PATTERN001:
                        return function (i, j) { return i % 2 == 0; };
                    case QRMaskPattern.PATTERN010:
                        return function (i, j) { return j % 3 == 0; };
                    case QRMaskPattern.PATTERN011:
                        return function (i, j) { return (i + j) % 3 == 0; };
                    case QRMaskPattern.PATTERN100:
                        return function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0; };
                    case QRMaskPattern.PATTERN101:
                        return function (i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
                    case QRMaskPattern.PATTERN110:
                        return function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 == 0; };
                    case QRMaskPattern.PATTERN111:
                        return function (i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 == 0; };

                    default:
                        throw new Error('bad maskPattern:' + maskPattern);
                }
            };

            _this.getErrorCorrectPolynomial = function (errorCorrectLength) {
                var a = qrPolynomial([1], 0);
                for (var i = 0; i < errorCorrectLength; i += 1) {
                    a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
                }
                return a;
            };

            _this.getLengthInBits = function (mode, type) {
                if (mode != QRMode.MODE_8BIT_BYTE || type < 1 || type > 40)
                    throw new Error('mode: ' + mode + '; type: ' + type);

                return type < 10 ? 8 : 16;
            };

            _this.getLostPoint = function (qrcode) {

                var moduleCount = qrcode.getModuleCount(),
                    lostPoint = 0;

                // LEVEL1

                for (var row = 0; row < moduleCount; row += 1) {
                    for (var col = 0; col < moduleCount; col += 1) {

                        var sameCount = 0,
                            dark = qrcode.isDark(row, col);

                        for (var r = -1; r <= 1; r += 1) {

                            if (row + r < 0 || moduleCount <= row + r) {
                                continue;
                            }

                            for (var c = -1; c <= 1; c += 1) {

                                if (col + c < 0 || moduleCount <= col + c) {
                                    continue;
                                }

                                if (r == 0 && c == 0) {
                                    continue;
                                }

                                if (dark == qrcode.isDark(row + r, col + c)) {
                                    sameCount += 1;
                                }
                            }
                        }

                        if (sameCount > 5) {
                            lostPoint += (3 + sameCount - 5);
                        }
                    }
                };

                // LEVEL2

                for (var row = 0; row < moduleCount - 1; row += 1) {
                    for (var col = 0; col < moduleCount - 1; col += 1) {
                        var count = 0;
                        if (qrcode.isDark(row, col)) count += 1;
                        if (qrcode.isDark(row + 1, col)) count += 1;
                        if (qrcode.isDark(row, col + 1)) count += 1;
                        if (qrcode.isDark(row + 1, col + 1)) count += 1;
                        if (count == 0 || count == 4) {
                            lostPoint += 3;
                        }
                    }
                }

                // LEVEL3

                for (var row = 0; row < moduleCount; row += 1) {
                    for (var col = 0; col < moduleCount - 6; col += 1) {
                        if (qrcode.isDark(row, col) &&
                            !qrcode.isDark(row, col + 1) &&
                            qrcode.isDark(row, col + 2) &&
                            qrcode.isDark(row, col + 3) &&
                            qrcode.isDark(row, col + 4) &&
                            !qrcode.isDark(row, col + 5) &&
                            qrcode.isDark(row, col + 6)) {
                            lostPoint += 40;
                        }
                    }
                }

                for (var col = 0; col < moduleCount; col += 1) {
                    for (var row = 0; row < moduleCount - 6; row += 1) {
                        if (qrcode.isDark(row, col) &&
                            !qrcode.isDark(row + 1, col) &&
                            qrcode.isDark(row + 2, col) &&
                            qrcode.isDark(row + 3, col) &&
                            qrcode.isDark(row + 4, col) &&
                            !qrcode.isDark(row + 5, col) &&
                            qrcode.isDark(row + 6, col)) {
                            lostPoint += 40;
                        }
                    }
                }

                // LEVEL4

                var darkCount = 0;

                for (var col = 0; col < moduleCount; col += 1) {
                    for (var row = 0; row < moduleCount; row += 1) {
                        if (qrcode.isDark(row, col)) {
                            darkCount += 1;
                        }
                    }
                }

                var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
                lostPoint += ratio * 10;

                return lostPoint;
            };

            return _this;
        }();

        //---------------------------------------------------------------------
        // QRMath
        //---------------------------------------------------------------------

        var QRMath = function () {

            var EXP_TABLE = new Array(256),
                LOG_TABLE = new Array(256);

            // initialize tables
            for (var i = 0; i < 8; i += 1) {
                EXP_TABLE[i] = 1 << i;
            }
            for (var i = 8; i < 256; i += 1) {
                EXP_TABLE[i] = EXP_TABLE[i - 4] ^
                    EXP_TABLE[i - 5] ^
                    EXP_TABLE[i - 6] ^
                    EXP_TABLE[i - 8];
            }
            for (var i = 0; i < 255; i += 1) {
                LOG_TABLE[EXP_TABLE[i]] = i;
            }

            var _this = {};

            _this.glog = function (n) {

                if (n < 1) {
                    throw new Error('glog(' + n + ')');
                }

                return LOG_TABLE[n];
            };

            _this.gexp = function (n) {

                while (n < 0) {
                    n += 255;
                }

                while (n >= 256) {
                    n -= 255;
                }

                return EXP_TABLE[n];
            };

            return _this;
        }();

        //---------------------------------------------------------------------
        // qrPolynomial
        //---------------------------------------------------------------------

        function qrPolynomial(num, shift) {

            if (typeof num.length == 'undefined') {
                throw new Error(num.length + '/' + shift);
            }

            var _num = function () {
                var offset = 0;
                while (offset < num.length && num[offset] == 0) {
                    offset += 1;
                }
                var _num = new Array(num.length - offset + shift);
                for (var i = 0; i < num.length - offset; i += 1) {
                    _num[i] = num[i + offset];
                }
                return _num;
            }();

            var _this = {};

            _this.getAt = function (index) {
                return _num[index];
            };

            _this.getLength = function () {
                return _num.length;
            };

            _this.multiply = function (e) {

                var num = new Array(_this.getLength() + e.getLength() - 1);

                for (var i = 0; i < _this.getLength(); i += 1) {
                    for (var j = 0; j < e.getLength(); j += 1) {
                        num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i)) + QRMath.glog(e.getAt(j)));
                    }
                }

                return qrPolynomial(num, 0);
            };

            _this.mod = function (e) {

                if (_this.getLength() - e.getLength() < 0) {
                    return _this;
                }

                var ratio = QRMath.glog(_this.getAt(0)) - QRMath.glog(e.getAt(0));

                var num = new Array(_this.getLength());
                for (var i = 0; i < _this.getLength(); i += 1) {
                    num[i] = _this.getAt(i);
                }

                for (var i = 0; i < e.getLength(); i += 1) {
                    num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
                }

                // recursive call
                return qrPolynomial(num, 0).mod(e);
            };

            return _this;
        };

        //---------------------------------------------------------------------
        // QRRSBlock
        //---------------------------------------------------------------------

        var QRRSBlock = function () {

            // TODO is it possible to generate this block with JS in let kB?
            var RS_BLOCK_TABLE = [

                // L
                // M
                // Q
                // H

                // 1
                [1, 26, 19],
                [1, 26, 16],
                [1, 26, 13],
                [1, 26, 9],

                // 2
                [1, 44, 34],
                [1, 44, 28],
                [1, 44, 22],
                [1, 44, 16],

                // 3
                [1, 70, 55],
                [1, 70, 44],
                [2, 35, 17],
                [2, 35, 13],

                // 4
                [1, 100, 80],
                [2, 50, 32],
                [2, 50, 24],
                [4, 25, 9],

                // 5
                [1, 134, 108],
                [2, 67, 43],
                [2, 33, 15, 2, 34, 16],
                [2, 33, 11, 2, 34, 12],

                // 6
                [2, 86, 68],
                [4, 43, 27],
                [4, 43, 19],
                [4, 43, 15],

                // 7
                [2, 98, 78],
                [4, 49, 31],
                [2, 32, 14, 4, 33, 15],
                [4, 39, 13, 1, 40, 14],

                // 8
                [2, 121, 97],
                [2, 60, 38, 2, 61, 39],
                [4, 40, 18, 2, 41, 19],
                [4, 40, 14, 2, 41, 15],

                // 9
                [2, 146, 116],
                [3, 58, 36, 2, 59, 37],
                [4, 36, 16, 4, 37, 17],
                [4, 36, 12, 4, 37, 13],

                // 10
                [2, 86, 68, 2, 87, 69],
                [4, 69, 43, 1, 70, 44],
                [6, 43, 19, 2, 44, 20],
                [6, 43, 15, 2, 44, 16],

                // 11
                [4, 101, 81],
                [1, 80, 50, 4, 81, 51],
                [4, 50, 22, 4, 51, 23],
                [3, 36, 12, 8, 37, 13],

                // 12
                [2, 116, 92, 2, 117, 93],
                [6, 58, 36, 2, 59, 37],
                [4, 46, 20, 6, 47, 21],
                [7, 42, 14, 4, 43, 15],

                // 13
                [4, 133, 107],
                [8, 59, 37, 1, 60, 38],
                [8, 44, 20, 4, 45, 21],
                [12, 33, 11, 4, 34, 12],

                // 14
                [3, 145, 115, 1, 146, 116],
                [4, 64, 40, 5, 65, 41],
                [11, 36, 16, 5, 37, 17],
                [11, 36, 12, 5, 37, 13],

                // 15
                [5, 109, 87, 1, 110, 88],
                [5, 65, 41, 5, 66, 42],
                [5, 54, 24, 7, 55, 25],
                [11, 36, 12, 7, 37, 13],

                // 16
                [5, 122, 98, 1, 123, 99],
                [7, 73, 45, 3, 74, 46],
                [15, 43, 19, 2, 44, 20],
                [3, 45, 15, 13, 46, 16],

                // 17
                [1, 135, 107, 5, 136, 108],
                [10, 74, 46, 1, 75, 47],
                [1, 50, 22, 15, 51, 23],
                [2, 42, 14, 17, 43, 15],

                // 18
                [5, 150, 120, 1, 151, 121],
                [9, 69, 43, 4, 70, 44],
                [17, 50, 22, 1, 51, 23],
                [2, 42, 14, 19, 43, 15],

                // 19
                [3, 141, 113, 4, 142, 114],
                [3, 70, 44, 11, 71, 45],
                [17, 47, 21, 4, 48, 22],
                [9, 39, 13, 16, 40, 14],

                // 20
                [3, 135, 107, 5, 136, 108],
                [3, 67, 41, 13, 68, 42],
                [15, 54, 24, 5, 55, 25],
                [15, 43, 15, 10, 44, 16],

                // 21
                [4, 144, 116, 4, 145, 117],
                [17, 68, 42],
                [17, 50, 22, 6, 51, 23],
                [19, 46, 16, 6, 47, 17],

                // 22
                [2, 139, 111, 7, 140, 112],
                [17, 74, 46],
                [7, 54, 24, 16, 55, 25],
                [34, 37, 13],

                // 23
                [4, 151, 121, 5, 152, 122],
                [4, 75, 47, 14, 76, 48],
                [11, 54, 24, 14, 55, 25],
                [16, 45, 15, 14, 46, 16],

                // 24
                [6, 147, 117, 4, 148, 118],
                [6, 73, 45, 14, 74, 46],
                [11, 54, 24, 16, 55, 25],
                [30, 46, 16, 2, 47, 17],

                // 25
                [8, 132, 106, 4, 133, 107],
                [8, 75, 47, 13, 76, 48],
                [7, 54, 24, 22, 55, 25],
                [22, 45, 15, 13, 46, 16],

                // 26
                [10, 142, 114, 2, 143, 115],
                [19, 74, 46, 4, 75, 47],
                [28, 50, 22, 6, 51, 23],
                [33, 46, 16, 4, 47, 17],

                // 27
                [8, 152, 122, 4, 153, 123],
                [22, 73, 45, 3, 74, 46],
                [8, 53, 23, 26, 54, 24],
                [12, 45, 15, 28, 46, 16],

                // 28
                [3, 147, 117, 10, 148, 118],
                [3, 73, 45, 23, 74, 46],
                [4, 54, 24, 31, 55, 25],
                [11, 45, 15, 31, 46, 16],

                // 29
                [7, 146, 116, 7, 147, 117],
                [21, 73, 45, 7, 74, 46],
                [1, 53, 23, 37, 54, 24],
                [19, 45, 15, 26, 46, 16],

                // 30
                [5, 145, 115, 10, 146, 116],
                [19, 75, 47, 10, 76, 48],
                [15, 54, 24, 25, 55, 25],
                [23, 45, 15, 25, 46, 16],

                // 31
                [13, 145, 115, 3, 146, 116],
                [2, 74, 46, 29, 75, 47],
                [42, 54, 24, 1, 55, 25],
                [23, 45, 15, 28, 46, 16],

                // 32
                [17, 145, 115],
                [10, 74, 46, 23, 75, 47],
                [10, 54, 24, 35, 55, 25],
                [19, 45, 15, 35, 46, 16],

                // 33
                [17, 145, 115, 1, 146, 116],
                [14, 74, 46, 21, 75, 47],
                [29, 54, 24, 19, 55, 25],
                [11, 45, 15, 46, 46, 16],

                // 34
                [13, 145, 115, 6, 146, 116],
                [14, 74, 46, 23, 75, 47],
                [44, 54, 24, 7, 55, 25],
                [59, 46, 16, 1, 47, 17],

                // 35
                [12, 151, 121, 7, 152, 122],
                [12, 75, 47, 26, 76, 48],
                [39, 54, 24, 14, 55, 25],
                [22, 45, 15, 41, 46, 16],

                // 36
                [6, 151, 121, 14, 152, 122],
                [6, 75, 47, 34, 76, 48],
                [46, 54, 24, 10, 55, 25],
                [2, 45, 15, 64, 46, 16],

                // 37
                [17, 152, 122, 4, 153, 123],
                [29, 74, 46, 14, 75, 47],
                [49, 54, 24, 10, 55, 25],
                [24, 45, 15, 46, 46, 16],

                // 38
                [4, 152, 122, 18, 153, 123],
                [13, 74, 46, 32, 75, 47],
                [48, 54, 24, 14, 55, 25],
                [42, 45, 15, 32, 46, 16],

                // 39
                [20, 147, 117, 4, 148, 118],
                [40, 75, 47, 7, 76, 48],
                [43, 54, 24, 22, 55, 25],
                [10, 45, 15, 67, 46, 16],

                // 40
                [19, 148, 118, 6, 149, 119],
                [18, 75, 47, 31, 76, 48],
                [34, 54, 24, 34, 55, 25],
                [20, 45, 15, 61, 46, 16]
            ];

            var qrRSBlock = function (totalCount, dataCount) {
                var _this = {};
                _this.totalCount = totalCount;
                _this.dataCount = dataCount;
                return _this;
            };

            var _this = {};

            var getRsBlockTable = function (typeNumber, errorCorrectLevel) {
                switch (errorCorrectLevel) {
                    case QRErrorCorrectLevel['L']:
                        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
                    case QRErrorCorrectLevel['M']:
                        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
                    case QRErrorCorrectLevel['Q']:
                        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
                    case QRErrorCorrectLevel['H']:
                        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
                    default:
                        return undefined;
                }
            };

            _this.getRSBlocks = function (typeNumber, errorCorrectLevel) {

                var rsBlock = getRsBlockTable(typeNumber, errorCorrectLevel);

                if (typeof rsBlock == 'undefined') {
                    throw new Error('bad rs block @ typeNumber:' + typeNumber +
                        '/errorCorrectLevel:' + errorCorrectLevel);
                }

                var length = rsBlock.length / 3,
                    list = new Array();

                for (var i = 0; i < length; i += 1) {

                    var count = rsBlock[i * 3 + 0],
                        totalCount = rsBlock[i * 3 + 1],
                        dataCount = rsBlock[i * 3 + 2];

                    for (var j = 0; j < count; j += 1) {
                        list.push(qrRSBlock(totalCount, dataCount));
                    }
                }

                return list;
            };

            return _this;
        }();

        //---------------------------------------------------------------------
        // qrBitBuffer
        //---------------------------------------------------------------------

        var qrBitBuffer = function () {

            var _buffer = new Array(),
                _length = 0,
                _this = {};

            _this.getBuffer = function () {
                return _buffer;
            };

            _this.getAt = function (index) {
                var bufIndex = Math.floor(index / 8);
                return ((_buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
            };

            _this.put = function (num, length) {
                for (var i = 0; i < length; i += 1) {
                    _this.putBit(((num >>> (length - i - 1)) & 1) == 1);
                }
            };

            _this.getLengthInBits = function () {
                return _length;
            };

            _this.putBit = function (bit) {

                var bufIndex = Math.floor(_length / 8);
                if (_buffer.length <= bufIndex) {
                    _buffer.push(0);
                }

                if (bit) {
                    _buffer[bufIndex] |= (0x80 >>> (_length % 8));
                }

                _length += 1;
            };

            return _this;
        };

        //---------------------------------------------------------------------
        // qr8BitByte
        //---------------------------------------------------------------------

        var qr8BitByte = function (data) {

            var _mode = QRMode.MODE_8BIT_BYTE,
                _data = data,
                _bytes = qrcode.stringToBytes(data),
                _this = {};

            _this.getMode = function () {
                return _mode;
            };

            _this.getLength = function (buffer) {
                return _bytes.length;
            };

            _this.write = function (buffer) {
                for (var i = 0; i < _bytes.length; i += 1) {
                    buffer.put(_bytes[i], 8);
                }
            };

            return _this;
        };

        // returns qrcode function.
        return qrcode;
    }();

    return qrcode; // eslint-disable-line no-undef
}()));

/**
*
The end of 'qr-creator' library.
*
**/

var DATA_IN_QR = null;
var CALLBACK_EXIT_BUTTOON = null;

function checkAndroidParameters(androidParameters){
    if(androidParameters == null){
        console.log('createDynamicLink.android; parameter is null')
        return false;
    }
    //application name
    if (!('apn' in androidParameters)){
        console.log('createDynamicLink.android."apn"; parameter not found')
        return false;
    }

    //link if app is not instaled
    if (!('afl' in androidParameters)){
        console.log('createDynamicLink.android."afl"; parameter not found')
        return false;
    }

    //minimum version of android
    if (!('version' in androidParameters)){
        console.log('createDynamicLink.android. "version"; parameter not found')
        return false;
    }
    return true;
}

function checkIOSparamters(iosParameters){
    if(iosParameters == null){
        console.log('createDynamicLink.ios; parameter is null')
        return false;
    }
    //application name
    if (!('ibi' in iosParameters)){
        console.log('createDynamicLink.ios."ibi"; parameter not found')
        return false;
    }

    //link if app is not instaled
    if (!('isi' in iosParameters)){
        console.log('createDynamicLink.ios."isi"; parameter not found');
        return false;
    }

    //minimum ios version
    if (!('imv' in iosParameters)){
        console.log('createDynamicLink.ios. "imv"; parameter not found');
        return false;
    }
    return true;
}

//check if there are all needed data
function checkPortParameters(portData){
    if (!('app' in portData)){
        console.log('checkPortParameters."app"; parameter not found');
        return false;
    }

    if (!('version' in portData)){
        console.log('checkPortParameters."version"; parameter not found');
        return false;
    }

    if (!('userID' in portData)){
        console.log('checkPortParameters."userID"; parameter not found');
        return false;
    }

    if (!('requestType' in portData)){
        console.log('checkPortParameters."requestType"; parameter not found');
        return false;
    }

    if (!('url' in portData)){
        console.log('checkPortParameters."url"; parameter not found');
        return false;
    }

    return true;
}

function isValidHttpUrl(string) {
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
  }

function createDeepLink(url, portData){
    if(isValidHttpUrl(url) == false){
        console.log ("createDeepLink; URL is not valid. Maybe http(s) is missing.");
        return;
    }

    if (checkPortParameters(portData) == false){
        console.log ("createDeepLink; parameters do not follow dynamic link rules");
        return;
    }

    const deepLink = new URL(url);
    console.log(portData.url);
    deepLink.searchParams.append("app", portData.app);
    deepLink.searchParams.append("version", portData.version);
    deepLink.searchParams.append("userID", portData.userID);
    deepLink.searchParams.append("requestType", portData.requestType);

    var encryptedDeepLink = encodeURIComponent(deepLink);
    encryptedDeepLink += "%26url="+ encodeURIComponent(portData.url);

    return (encryptedDeepLink.toString());
}

function createAndroidParams(URLSearchParams, andoridParams){
    URLSearchParams.append("apn", andoridParams.apn);
    URLSearchParams.append("version", andoridParams.version);
    
    if(andoridParams.afl != null)
        URLSearchParams.append("afl", andoridParams.afl);
    
    return URLSearchParams;
}

function createIOSParams(URLSearchParams, iosParams){
    URLSearchParams.append("ibi", iosParams.ibi);
    URLSearchParams.append("isi", iosParams.isi);
    URLSearchParams.append("imv", iosParams.imv);

    return URLSearchParams;
}

function createOtherPlatformsLinkParams(URLSearchParams, linkForOtherPlatforms){
    URLSearchParams.append("ofl", linkForOtherPlatforms);

    return URLSearchParams;
}

function createDynamicLink(shortURLlink, deepLinkURL, portData, androidParameters, iosParameters, otherPlatformsLink){
    if (checkAndroidParameters(androidParameters) == false || checkIOSparamters(iosParameters) == false){
        console.log ("createDynamicLink; parameters do not follow dynamic link rules");
        return;
    }
    var dynamicLink = new URL(shortURLlink);
    var urlSearchParams = new URLSearchParams();

    dynamicLink.search = createAndroidParams(urlSearchParams, androidParameters);
    dynamicLink.search = createIOSParams(urlSearchParams, iosParameters);
    dynamicLink.search = createOtherPlatformsLinkParams(urlSearchParams, otherPlatformsLink);
    var deepLinkStr = createDeepLink(deepLinkURL, portData);
    return dynamicLink.toString() + '&link=' + deepLinkStr;
}


function readSettings(text) {
    try{
        DATA_IN_QR = text; //JSON.stringify(text);
        let settings = {
            "text": text,
            "radius": "0.1",
            "ecLevel": "H",
            "fill": "#705546",
            "background": null,
            "size": "300"
        };
        return settings;
    } catch (error) {
        console.error(error);
  }
}

function renderQrCode(shorLinkURL, deepLinkURL, androidData, iosData, otherPlatformsLink, options) {
    var dynamicLink = createDynamicLink(shorLinkURL, deepLinkURL, options, androidData, iosData, otherPlatformsLink);

    let container = document.querySelector('#qr-code'),
        settings = readSettings(dynamicLink);

    QrCreator.render(settings, container);
}


    ///////////////////////////////////////////////////
    /*export*/ class ZeroPassPortWidget {
    static render(shorLinkURL, deepLinkURL, androidData, iosData, otherPlatformsLink, callbackExitButton, config, $element) {
        CALLBACK_EXIT_BUTTOON = callbackExitButton;
        config.app = "port.app"
        createWidget(shorLinkURL, deepLinkURL, androidData, iosData, otherPlatformsLink, config, $element);
        
        //changing the opacity of the element
        //start after 50 millisecons
        setTimeout(function () {
        var divBackground = $element.getElementsByClassName("divwindowpl")[0];
        let  i = parseFloat(divBackground.style.opacity);
        //it appears in 1 second
        let interval = setInterval(()=>{
          i+=0.025
          divBackground.style.opacity = i;

          if (i > 1.0)
              clearInterval(interval);
        },25)
        }, 50);
    }
    }
ZeroPassPortWidget['render'] = ZeroPassPortWidget.render;
self['ZeroPassPortWidget'] = ZeroPassPortWidget;


function createWidget(shorLinkURL, deepLinkURL, androidData, iosData,otherPlatformsLink, options, $element) {
    $element.innerHTML += widgetHTML;

    renderQrCode(shorLinkURL, deepLinkURL, androidData, iosData, otherPlatformsLink, options);
    
    }

const copyClipboard = () => {
    const el = document.createElement('textarea');
    el.value = DATA_IN_QR;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};


const openDeepLink = () => {
    location.href = DATA_IN_QR;
};

const closeButtonPressed = () => {
    CALLBACK_EXIT_BUTTOON();
}

window.closeButtonPressed = closeButtonPressed;
window.openDeepLink = openDeepLink;
window.copyClipboard = copyClipboard;

var widgetHTML = '<div data-w-id="ab4e72fd-54b3-defa-783f-a5abc41f4420" style="opacity:1.0" class="divbackgroundblackpl">' +
'    <div data-w-id="55797719-95b5-9f3e-d991-33150963fb19" style="opacity:0.0" class="divwindowpl">' +
'      <div class="div1portpl">' +
'        <div class="div1apl"></div>' +
'        <div class="div1apl"><div style="margin-top: 30px; width: 60px;"><!--<img src="images/port.link-logo.svg" loading="lazy" width="60" alt="" class="imagepl">-->' +
'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
'	 viewBox="0 0 243.98 174" style="enable-background:new 0 0 243.98 174;" xml:space="preserve">' +
'<style type="text/css">' +
'	.st0{fill:#998675;}' +
'	.st1{fill:#B58761;}' +
'	.st2{fill:url(#SVGID_1_);}' +
'</style>' +
'<path class="st0" d="M233.84,38.21l-68.22,12.98c-19.54-23.98-54.81-27.59-78.79-8.05c-10.19,8.3-17.15,19.95-19.63,32.87H1.16' +
'	C4.15,46.2,17.86,19.55,38.4,0h168.34C218.07,10.8,227.33,23.75,233.84,38.21z"/>' +
'<path class="st1" d="M233.9,138.21v0.15c-5.98,13.33-14.3,25.39-24.44,35.64H35.67C16.06,154.13,3.24,127.55,0.92,98.01h66.44' +
'	c6.32,30.27,35.98,49.69,66.25,43.39c11.34-2.38,21.66-8.18,29.55-16.66L233.9,138.21z"/>' +
'<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="255.9776" y1="921.0519" x2="96.3439" y2="921.0519" gradientTransform="matrix(1 0 0 1 -12 -833.3666)">' +
'	<stop  offset="0" style="stop-color:#B2876F"/>' +
'	<stop  offset="1" style="stop-color:#896954"/>' +
'</linearGradient>' +
'<path class="st2" d="M243.82,89.93l-5.76,30.19c-0.28,0.65-0.97,1.03-1.66,0.89l-81.74-15c-10.12,18.1-32.99,24.57-51.09,14.45' +
'	S79.01,87.47,89.13,69.37s32.99-24.57,51.09-14.45c6.82,3.81,12.28,9.67,15.62,16.72l80.51-14.78c0.72-0.16,1.44,0.22,1.72,0.89' +
'	l5.76,30.19C244.03,88.59,244.03,89.28,243.82,89.93z"/>' +
'</svg>' +
'           </div>' +
'           </div>' +
'        <div class="div1xpl">' +
'          <a href="javascript:closeButtonPressed()" class="linkblockxpl w-inline-block">' +
'           <div style="width: 16px; margin-right: 24px;">' +
'           <div class="xmouseover2pl">' +
'               <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
'	             viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">' +
'                   <style type="text/css">' +
'               	.st01{fill:#A8A8A8;}' +
'               </style>' +
'               <g>' +
'	            <path class="st01" d="M504.8,45.4l-35.4-35c-9.6-9.6-25.4-9.6-35.4,0L257.6,186.9L77.8,7.1c-9.6-9.6-25.4-9.6-35.4,0L7.1,42.5' +
'	        	c-9.6,9.6-9.6,25.4,0,35.4l179.4,179.4L10.4,434.1c-9.6,9.6-9.6,25.4,0,35.4l35.4,35.4c9.6,9.6,25.4,9.6,35.4,0l176.5-176.5' +
'	        	l176.5,176.5c9.6,9.6,25.4,9.6,35.4,0l35.4-35.4c9.6-9.6,9.6-25.4,0-35.4L327.9,257.6L504.4,81.2C514.4,71.2,514.4,55.4,504.8,45.4' +
'	        	z"/>' +
'               </g>' +
'               </svg>' +
'           </div>' +
'           </div>' +
'           </a>' +
'        </div>' +
'      </div>' +
'      <div>' +
'        <div class="text1portpl">Attest</div>' +
'        <div class="text2portpl">Scan the QR code with Port app, or press the button if the Port app is on the same device.</div>' +
'      </div>' +
'      <div class="divqrpl">' + 
'       <section id="qr-code"></section>' +
'       </div>' +
'      <div class="div-buttonpl">' +
'        <div class="textlink1pl">' +
'          <a href="javascript:copyClipboard()" class="link-2">copy magnet link</a>' +
'        </div>' +
'        <a href="javascript:openDeepLink()" class="buttonpl w-button">Launch Port</a>' +
'      </div>' +
'      <div class="divdownloadpl">' +
'        <div class="textlink2pl">' +
'          <a href="https://port.link" class="linkpl">Download Port mobile app</a>' +
'        </div>' +
'      </div>' +
'    </div>' +
'  </div>' +
' <script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=60a5ad862f20836237dc00cc"' +
' type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="' +
' crossorigin="anonymous"><\\/script>' +
' < script src = "js/webflow.js" type = "text/javascript" ><\\/script>' +
' < !--[if lte IE 9]> <script src="https://cdnjs.cloudflare.com/ajax/libs/placeholders/3.0.2/placeholders.min.js"><\\/script><![endif] -->';
