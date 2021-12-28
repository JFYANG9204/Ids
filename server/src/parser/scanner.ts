

namespace ds {

    export interface Scanner {
        getText(): string;
        getStartPosition(): number;
        getTokenText(): string;
        isIdentifier(): boolean;
        isReservedWord(): boolean;
        next(): SyntaxKind;
    }

    // `Identifier`允许的开始字符和后续字符表，以2个数字为一组范围，
    // 所以，后续检索时，需要以偶数索引为上限，以其+1索引为下限，如果搜索值在
    // 这两个数的范围内，则视为搜索到，如果是离散值，则范围上下限相同。
    // 标准为 Unicode Standard 3.0
    // 开头字符为 Unicode Standard 3.0 字符或者下划线 '_'
    // 后续字符为 Unicode Standard 3.0 字符或者 数字 '#' '@' '$' '_'

    const unicodeIdentifierStart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2208, 2208, 2210, 2220, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2423, 2425, 2431, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3133, 3160, 3161, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3294, 3294, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3424, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6263, 6272, 6312, 6314, 6314, 6320, 6389, 6400, 6428, 6480, 6509, 6512, 6516, 6528, 6571, 6593, 6599, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7401, 7404, 7406, 7409, 7413, 7414, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11823, 11823, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42647, 42656, 42735, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43642, 43642, 43648, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, ];
    const unicodeIdentifierSubsequent = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 768, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1155, 1159, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1425, 1469, 1471, 1471, 1473, 1474, 1476, 1477, 1479, 1479, 1488, 1514, 1520, 1522, 1552, 1562, 1568, 1641, 1646, 1747, 1749, 1756, 1759, 1768, 1770, 1788, 1791, 1791, 1808, 1866, 1869, 1969, 1984, 2037, 2042, 2042, 2048, 2093, 2112, 2139, 2208, 2208, 2210, 2220, 2276, 2302, 2304, 2403, 2406, 2415, 2417, 2423, 2425, 2431, 2433, 2435, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2492, 2500, 2503, 2504, 2507, 2510, 2519, 2519, 2524, 2525, 2527, 2531, 2534, 2545, 2561, 2563, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2620, 2620, 2622, 2626, 2631, 2632, 2635, 2637, 2641, 2641, 2649, 2652, 2654, 2654, 2662, 2677, 2689, 2691, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2748, 2757, 2759, 2761, 2763, 2765, 2768, 2768, 2784, 2787, 2790, 2799, 2817, 2819, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2876, 2884, 2887, 2888, 2891, 2893, 2902, 2903, 2908, 2909, 2911, 2915, 2918, 2927, 2929, 2929, 2946, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3006, 3010, 3014, 3016, 3018, 3021, 3024, 3024, 3031, 3031, 3046, 3055, 3073, 3075, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3160, 3161, 3168, 3171, 3174, 3183, 3202, 3203, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3260, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3294, 3294, 3296, 3299, 3302, 3311, 3313, 3314, 3330, 3331, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3396, 3398, 3400, 3402, 3406, 3415, 3415, 3424, 3427, 3430, 3439, 3450, 3455, 3458, 3459, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3530, 3530, 3535, 3540, 3542, 3542, 3544, 3551, 3570, 3571, 3585, 3642, 3648, 3662, 3664, 3673, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3769, 3771, 3773, 3776, 3780, 3782, 3782, 3784, 3789, 3792, 3801, 3804, 3807, 3840, 3840, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3911, 3913, 3948, 3953, 3972, 3974, 3991, 3993, 4028, 4038, 4038, 4096, 4169, 4176, 4253, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4957, 4959, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5908, 5920, 5940, 5952, 5971, 5984, 5996, 5998, 6000, 6002, 6003, 6016, 6099, 6103, 6103, 6108, 6109, 6112, 6121, 6155, 6157, 6160, 6169, 6176, 6263, 6272, 6314, 6320, 6389, 6400, 6428, 6432, 6443, 6448, 6459, 6470, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6608, 6617, 6656, 6683, 6688, 6750, 6752, 6780, 6783, 6793, 6800, 6809, 6823, 6823, 6912, 6987, 6992, 7001, 7019, 7027, 7040, 7155, 7168, 7223, 7232, 7241, 7245, 7293, 7376, 7378, 7380, 7414, 7424, 7654, 7676, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8204, 8205, 8255, 8256, 8276, 8276, 8305, 8305, 8319, 8319, 8336, 8348, 8400, 8412, 8417, 8417, 8421, 8432, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11647, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11744, 11775, 11823, 11823, 12293, 12295, 12321, 12335, 12337, 12341, 12344, 12348, 12353, 12438, 12441, 12442, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42539, 42560, 42607, 42612, 42621, 42623, 42647, 42655, 42737, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43047, 43072, 43123, 43136, 43204, 43216, 43225, 43232, 43255, 43259, 43259, 43264, 43309, 43312, 43347, 43360, 43388, 43392, 43456, 43471, 43481, 43520, 43574, 43584, 43597, 43600, 43609, 43616, 43638, 43642, 43643, 43648, 43714, 43739, 43741, 43744, 43759, 43762, 43766, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44010, 44012, 44013, 44016, 44025, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65024, 65039, 65056, 65062, 65075, 65076, 65101, 65103, 65136, 65140, 65142, 65276, 65296, 65305, 65313, 65338, 65343, 65343, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, ];

    function lookupUnicode(code: number, map: readonly number[]): boolean {
        if (code < map[0] || code > map[map.length - 1]) {
            return false;
        }

        // 二分法查找
        let low = 0;
        let high = map.length;
        let mid: number;
        while (low < high - 1) {
            mid = low + (high - low) / 2;
            mid -= mid % 2;
            if (map[mid] <= code && code <= map[mid + 1]) {
                return true;
            }
            if (code > map[mid]) {
                low = mid + 2;
            } else {
                high = mid;
            }
        }

        return false;
    }

    function isUnicodeIdentifierStart(code: number): boolean {
        return lookupUnicode(code, unicodeIdentifierStart);
    }

    function isUnicodeIdentifierSubsequent(code: number): boolean {
        return lookupUnicode(code, unicodeIdentifierSubsequent);
    }

    export const enum CharacterCodes {
        backSpace          = 8,
        tab                = 9,     //   '\t'
        lineFeed           = 10,    //   '\n'
        carriageReturn     = 13,    //   '\r'
        shiftOut           = 14,
        space              = 32,
        exclamation        = 33,    //    '!'
        quotation          = 34,    //    '"'
        hash               = 35,    //    '#'
        dollar             = 36,    //    '$'
        percent            = 37,    //    '%'
        ampersand          = 38,    //    '&'
        apostrophe         = 39,    //    '''
        openParen          = 40,    //    '('
        closeParen         = 41,    //    ')'
        asterisk           = 42,    //    '*'
        plus               = 43,    //    '+'
        comma              = 44,    //    ','
        minus              = 45,    //    '-'
        dot                = 46,    //    '.'
        slash              = 47,    //    '/'
        _0                 = 48,    //    '0'
        _1                 = 49,    //    '1'
        _2                 = 50,    //    '2'
        _3                 = 51,    //    '3'
        _4                 = 52,    //    '4'
        _5                 = 53,    //    '5'
        _6                 = 54,    //    '6'
        _7                 = 55,    //    '7'
        _8                 = 56,    //    '8'
        _9                 = 57,    //    '9'
        colon              = 58,    //    ':'
        semicolon          = 59,    //    ';'
        lessThan           = 60,    //    '<'
        equals             = 61,    //    '='
        greaterThan        = 62,    //    '>'
        question           = 63,    //    '?'
        at                 = 64,    //    '@'
        uppercaseA         = 65,    //    'A'
        uppercaseB         = 66,    //    'B'
        uppercaseC         = 67,    //    'C'
        uppercaseD         = 68,    //    'D'
        uppercaseE         = 69,    //    'E'
        uppercaseF         = 70,    //    'F'
        uppercaseG         = 71,    //    'G'
        uppercaseH         = 72,    //    'H'
        uppercaseI         = 73,    //    'I'
        uppercaseJ         = 74,    //    'J'
        uppercaseK         = 75,    //    'K'
        uppercaseL         = 76,    //    'L'
        uppercaseM         = 77,    //    'M'
        uppercaseN         = 78,    //    'N'
        uppercaseO         = 79,    //    'O'
        uppercaseP         = 80,    //    'P'
        uppercaseQ         = 81,    //    'Q'
        uppercaseR         = 82,    //    'R'
        uppercaseS         = 83,    //    'S'
        uppercaseT         = 84,    //    'T'
        uppercaseU         = 85,    //    'U'
        uppercaseV         = 86,    //    'V'
        uppercaseW         = 87,    //    'W'
        uppercaseX         = 88,    //    'X'
        uppercaseY         = 89,    //    'Y'
        uppercaseZ         = 90,    //    'Z'
        openBracket        = 91,    //    '['
        backSlash          = 92,    //    '\'
        closeBracket       = 93,    //    ']'
        caret              = 94,    //    '^'
        underscore         = 95,    //    '_'
        lowercaseA         = 97,    //    'A'
        lowercaseB         = 98,    //    'B'
        lowercaseC         = 99,    //    'C'
        lowercaseD         = 100,   //    'D'
        lowercaseE         = 101,   //    'E'
        lowercaseF         = 102,   //    'F'
        lowercaseG         = 103,   //    'G'
        lowercaseH         = 104,   //    'H'
        lowercaseI         = 105,   //    'I'
        lowercaseJ         = 106,   //    'J'
        lowercaseK         = 107,   //    'K'
        lowercaseL         = 108,   //    'L'
        lowercaseM         = 109,   //    'M'
        lowercaseN         = 110,   //    'N'
        lowercaseO         = 111,   //    'O'
        lowercaseP         = 112,   //    'P'
        lowercaseQ         = 113,   //    'Q'
        lowercaseR         = 114,   //    'R'
        lowercaseS         = 115,   //    'S'
        lowercaseT         = 116,   //    'T'
        lowercaseU         = 117,   //    'U'
        lowercaseV         = 118,   //    'V'
        lowercaseW         = 119,   //    'W'
        lowercaseX         = 120,   //    'X'
        lowercaseY         = 121,   //    'Y'
        lowercaseZ         = 122,   //    'Z'
        openBrace          = 123,   //    '{'
        bar                = 124,   //    '|'
        closeBrace         = 125,   //    '}'
        nonBreakingSpace   = 160,
        oghamSpace         = 5760,
        lineSeparator      = 8232,
        paragraphSeparator = 8233
    }

    /**
     * 判断字符编码是否是数字
     * @param code 字符对应编码值
     * @returns
     */
    export function isNumberCode(code: number): boolean {
        return CharacterCodes._0 <= code && code <= CharacterCodes._9;
    }

    /**
     * 判断是否是16进制数字编码
     *
     *  包括 0-9 a-f A-F
     *
     * @param code
     * @returns
     */
    export function isHexNumberCode(code: number): boolean {
        return isNumberCode(code)
        || (CharacterCodes.uppercaseA <= code && code <= CharacterCodes.uppercaseF)
        || (CharacterCodes.lowercaseA <= code && code <= CharacterCodes.lowercaseF);
    }

    /**
     * 判断是否是换行符
     *
     * | 值      | 名称                   |  |
     * | :------ | :------------------- | :----- |
     * | \u000A  |  Line Feed           | <LF> |
     * | \u000D  |  Carriage Return     | <CR> |
     * | \u2028  |  Line Separator      | <LS> |
     * | \u2029  |  Paragraph Separator | <PS> |
     *
     * @param code
     * @returns
     */
    export function isLineBreak(code: number): boolean {
        return code === CharacterCodes.lineFeed
            || code === CharacterCodes.carriageReturn
            || code === CharacterCodes.paragraphSeparator
            || code === CharacterCodes.lineSeparator;
    }

    /**
     * 判断字符是否为允许的`Identifier`开始字符，
     * 允许字符为 下划线'_' 或 英文字母 或 Unicode Standard 3.0 定义的字符
     * @param code 字符编码值
     * @returns
     */
    export function isIdentifierStart(code: number): boolean {
        return code === CharacterCodes.underscore
            || isUnicodeIdentifierStart(code)
            || (CharacterCodes.uppercaseA <= code && code <= CharacterCodes.uppercaseZ)
            || (CharacterCodes.lowercaseA <= code && code <= CharacterCodes.lowercaseZ);
    }

    /**
     * 判断字符是否为允许的`Identifier`后续字符，
     * 允许字符为 下划线 '_' 、美元符号 '$' 、井号 '#' 、 '@' 、英文字母 、数字 和 Unicode Standard 3.0 定义的字符
     * @param code
     */
    export function isIdentifierSubsequent(code: number): boolean {
        return isUnicodeIdentifierSubsequent(code)
            || isNumberCode(code)
            || (CharacterCodes.uppercaseA <= code && code <= CharacterCodes.uppercaseZ)
            || (CharacterCodes.lowercaseA <= code && code <= CharacterCodes.lowercaseZ)
            || code === CharacterCodes.underscore    // '_'
            || code === CharacterCodes.dollar        // '$'
            || code === CharacterCodes.hash          // '#'
            || code === CharacterCodes.at;           // '@'
    }

    /**
     * 判断`Id`对应字符串是否为合法的命名
     * @param name `Identifier`字符串内容
     * @returns
     */
    export function isIdentifierName(name: string): boolean {
        let char = name.codePointAt(0);
        if (!char || !isIdentifierStart(char)) {
            return false;
        }
        if (name.length > 1) {
            for (let i = 1; i < name.length; i++) {
                char = name.codePointAt(i);
                if (!char || !isIdentifierSubsequent(char)) {
                    return false;
                }
            }
        }
        return true;
    }

    function getMapEntries(obj: { [key: string]: number }) {
        let entries: [string, number][] = [];
        Object.keys(obj).forEach(key => entries.push([ key, obj[key] ]));
        return entries;
    }

    const textToScriptKeywordTokenKindObject: { [key: string]: number } = {
        "and"            : SyntaxKind.andKeyword,
        "case"           : SyntaxKind.caseKeyword,
        "const"          : SyntaxKind.constKeyword,
        "dim"            : SyntaxKind.dimKeyword,
        "do"             : SyntaxKind.doKeyword,
        "each"           : SyntaxKind.eachKeyword,
        "else"           : SyntaxKind.elseKeyword,
        "elseif"         : SyntaxKind.elseIfKeyword,
        "end"            : SyntaxKind.endKeyword,
        "error"          : SyntaxKind.errorKeyword,
        "exit"           : SyntaxKind.exitKeyword,
        "explicit"       : SyntaxKind.exlplicitKeyword,
        "false"          : SyntaxKind.falseKeyword,
        "for"            : SyntaxKind.forKeyword,
        "function"       : SyntaxKind.functionKeyword,
        "globalvariables": SyntaxKind.globalVariablesKeyword,
        "goto"           : SyntaxKind.gotoKeywords,
        "if"             : SyntaxKind.ifKeyword,
        "implicit"       : SyntaxKind.implicitKeyword,
        "in"             : SyntaxKind.inKeyword,
        "is"             : SyntaxKind.isKeyword,
        "like"           : SyntaxKind.likeKeyword,
        "loop"           : SyntaxKind.loopKeyword,
        "mod"            : SyntaxKind.modKeyword,
        "next"           : SyntaxKind.nextKeyword,
        "not"            : SyntaxKind.notKeyword,
        "null"           : SyntaxKind.nullKeyword,
        "on"             : SyntaxKind.onKeyword,
        "option"         : SyntaxKind.optionKeyword,
        "or"             : SyntaxKind.orKeyword,
        "paper"          : SyntaxKind.paperKeyword,
        "resume"         : SyntaxKind.resumeKeyword,
        "section"        : SyntaxKind.sectionKeyword,
        "select"         : SyntaxKind.selectKeyword,
        "step"           : SyntaxKind.stepKeyword,
        "sub"            : SyntaxKind.subKeyword,
        "then"           : SyntaxKind.thenKeyword,
        "to"             : SyntaxKind.toKeyword,
        "true"           : SyntaxKind.trueKeyword,
        "until"          : SyntaxKind.untilKeyword,
        "while"          : SyntaxKind.whileKeyword,
        "with"           : SyntaxKind.withKeyword,
        "xor"            : SyntaxKind.xorKeyword
    };

    const textToDeclareKeywordTokenKindObject: { [key: string]: number } = {
        "enum"       : SyntaxKind.enumKeyword,
        "implements" : SyntaxKind.implementsKeyword,
        "optional"   : SyntaxKind.optionalKeyword,
        "default"    : SyntaxKind.defaultKeyword,
        "namespace"  : SyntaxKind.namespaceKeyword,
        "interface"  : SyntaxKind.interfaceKeyword,
        "class"      : SyntaxKind.classKeyword,
        "readonly"   : SyntaxKind.readonlyKeyword,
        "writeonly"  : SyntaxKind.writeonlyKeyword,
        "property"   : SyntaxKind.propertyKeyword,
        "paramarray" : SyntaxKind.paramArrayKeyword,
        "get"        : SyntaxKind.getKeyword,
        "set"        : SyntaxKind.setKeyword,
        "as"         : SyntaxKind.asKeyword,
        "of"         : SyntaxKind.ofKeyword
    };

    const textToTokenKindObject: { [key: string]: number } = {
        ...textToScriptKeywordTokenKindObject,
        ...textToDeclareKeywordTokenKindObject,
        "("  : SyntaxKind.openParenToken,
        ")"  : SyntaxKind.closeParenToken,
        "["  : SyntaxKind.openBracketToken,
        "]"  : SyntaxKind.closeBracketToken,
        "{"  : SyntaxKind.openBraceToken,
        "}"  : SyntaxKind.closeBraceToken,
        "+"  : SyntaxKind.plusToken,
        "-"  : SyntaxKind.minusToken,
        "*"  : SyntaxKind.asteriskToken,
        "/"  : SyntaxKind.slashToken,
        "\\" : SyntaxKind.backSlashToken,
        "="  : SyntaxKind.equalsToken,
        "<"  : SyntaxKind.lessThanToken,
        ">"  : SyntaxKind.greaterThanToken,
        "<=" : SyntaxKind.lessThanEqualsToken,
        ">=" : SyntaxKind.greaterThanEqualsToken,
        ","  : SyntaxKind.commaToken,
        ":"  : SyntaxKind.colonToken,
        ";"  : SyntaxKind.semicolonToken,
        "."  : SyntaxKind.dotToken,
        ".." : SyntaxKind.dotDotToken,
        "^"  : SyntaxKind.caretToken,
        "||" : SyntaxKind.barBarToken,
        "&&" : SyntaxKind.ampersandAmpersandToken,
    };

    const textToScriptKeywordTokenKind = new Map(getMapEntries(textToScriptKeywordTokenKindObject));
    const textToDeclareKeywordTokenKind = new Map(getMapEntries(textToDeclareKeywordTokenKindObject));
    const textToTokenKind = new Map(getMapEntries(textToTokenKindObject));

    /**
     * 判断是否为保留字，声明文件(.d.mrs)和一般脚本文件(.dms,.mrs)有所区别
     * @param word 文本值
     * @param kind 文件类型，主要区分是否为'.d.mrs'声明文件
     * @returns
     */
    function isReservedWord(word: string, kind?: FileKind): SyntaxKind | undefined {
        let lowerName = word.toLowerCase();
        if (kind === FileKind.declare && textToDeclareKeywordTokenKind.has(lowerName)) {
            return textToDeclareKeywordTokenKind.get(lowerName);
        }
        return textToScriptKeywordTokenKind.get(lowerName);
    }

    /**
     * 判断是否为空白字符
     * @param code
     * @returns
     */
    function isWhitespace(code: number): boolean {
        switch (code) {
            case 0x0009: // CHARACTER TABULATION
            case 0x000b: // LINE TABULATION
            case 0x000c: // FORM FEED
            case CharacterCodes.space:
            case CharacterCodes.nonBreakingSpace:
            case CharacterCodes.oghamSpace:
            case 0x2000: // EN QUAD
            case 0x2001: // EM QUAD
            case 0x2002: // EN SPACE
            case 0x2003: // EM SPACE
            case 0x2004: // THREE-PER-EM SPACE
            case 0x2005: // FOUR-PER-EM SPACE
            case 0x2006: // SIX-PER-EM SPACE
            case 0x2007: // FIGURE SPACE
            case 0x2008: // PUNCTUATION SPACE
            case 0x2009: // THIN SPACE
            case 0x200a: // HAIR SPACE
            case 0x202f: // NARROW NO-BREAK SPACE
            case 0x205f: // MEDIUM MATHEMATICAL SPACE
            case 0x3000: // IDEOGRAPHIC SPACE
            case 0xfeff: // ZERO WIDTH NO-BREAK SPACE
              return true;

            default:
              return false;
        }
    }

    /**
     * 判断是否为空白符或者换行符
     * @param code
     * @returns
     */
    function isWhitespaceLike(code: number): boolean {
        return isWhitespace(code) || isLineBreak(code);
    }

    /**
     * 获取文本对应的Token类型，不是保留字或符号时，返回空
     * @param text
     */
    function getTextTokenKind(text: string): SyntaxKind | undefined {
        return textToTokenKind.get(text.toLowerCase());
    }

    // 匹配完整的换行符，用来计算行数
    const lineBreak = /\r\n?|[\n\u2028\u2029]/;
    const lineBreakG = new RegExp(lineBreak.source, "g");

    let lineStarts: number[] = [];

    /**
     * 获取输入字符串中，所有新行开始的位置
     * @param input 输入文本内容
     * @returns
     */
    function getLineStarts(input: string): number[] {
        let lineStarts: number[] = [];
        lineBreakG.lastIndex = 0;
        while (lineBreakG.exec(input)) {
            lineStarts.push(lineBreakG.lastIndex);
        }
        return lineStarts;
    }

    /**
     * 获取源文件的所有行起始位置，如果当前没有赋值，则读取起始位置
     * @param sourceFile 源文件对象
     * @returns
     */
    function getSourceFileLineStarts(sourceFile: SourceFile) {
        return sourceFile.lineStarts || (sourceFile.lineStarts = getLineStarts(sourceFile.text));
    }

    export function createScanner(input: string) {
        let text = input;
        // 当前字符位置
        let pos = 0;
    }

}

