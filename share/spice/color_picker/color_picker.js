(function (env) {
    "use strict";
    env.ddg_spice_color_picker = function(){

        //Acts as a cache of this instant answer's DOM. Because the DOM isn't necessarily ready at
        //  this point, this all gets initialized later.
        var local_dom = {
            initialized: false
        };

        //Maintains currently selected palette type so that it doesn't have to be read from
        //  $palette_select on every update.
        var palette_type = 'adjacent';

        //Maintains the current color in all supported formats.
        var current_color = get_initial_color();

        //Holds coordinate positions for the selection markers in the hue and saturation/value
        //  pickers.
        var markers = get_marker_positions(current_color.hsv);

        //Indicates whether the user is currently dragging the mouse in the hue and saturation/value
        //  pickers.
        var saturation_value_mousedown = false;
        var hue_mousedown = false;

        //TODO: use the real image paths
        Spice.add({
            id: "color_picker",
            name: "ColorPicker",
            data: {
                saturation_value_path: 'http://chrisharrill.com/images/saturation_value_gradient.png',//DDG.get_asset_path('color_picker', 'assets/saturation_value_gradient.png'),
                hue_path: 'http://chrisharrill.com/images/hue_gradient.png'//DDG.get_asset_path('color_picker', 'assets/hue_gradient.png')
            },
            meta: {},
            templates: {
                detail: Spice.color_picker.content,
                item: Spice.color_picker.content,
                item_detail: false
            },
            onShow: function() {
                //The DOM cache was not initialized when it was created. The DOM should be ready
                // here, so we can initialize now.
                if (!local_dom.initialized)
                    initialize_local_dom();
                update_all();
            }
        });

        /* UTILITY FUNCTIONS */

        //Converts a given string value to an integer, which is forced between the given bounds. If
        //  the input string is not a valid number, it is treated as 0.
        function to_bounded_integer(value, lower_bound, upper_bound) {
            var num = Math.round(Number(value));
            if (isNaN(num))
                num = 0;

            if (num < lower_bound)
                num = Math.ceil(lower_bound);
            if (num > upper_bound)
                num = Math.floor(upper_bound);

            return num
        }

        //Converts a given string value to a number, which is forced between the given bounds. If
        //  the input string is not a valid number, it is treated as 0.
        function to_bounded_number(value, lower_bound, upper_bound) {
            var num = Number(value);
            if (isNaN(num))
                num = 0;

            if (num < lower_bound)
                num = lower_bound;
            if (num > upper_bound)
                num = upper_bound;

            return num
        }

        //Finds the coordinates of a mouse or touch event relative to an element.
        function get_real_coordinates(event, $element) {
            var offset = local_dom.$saturation_value_picker.offset();
            var coordinates = {
                x: event.pageX - offset.left,
                y: event.pageY - offset.top
            };
            return coordinates;
        }

        /* EVENT HANDLERS */

        function saturation_value_clicked() {
            var coordinates = get_real_coordinates(event, local_dom.$saturation_value_picker);

            //Use the coordinates of the mouse/touch event to calculate the new saturation/value
            var saturation = Math.floor((coordinates.x / 256) * 100);
            var value = Math.floor(((256 - coordinates.y) / 256) * 100);
            var hue = current_color.hsv.hue;

            saturation = to_bounded_integer(saturation, 0, 100);
            value = to_bounded_integer(value, 0, 100);

            update_all_from_hsv(hue, saturation, value);
        }

        function hue_clicked() {
            var coordinates = get_real_coordinates(event, local_dom.$hue_picker);

            //Use the coordinates of the mouse/touch event to calculate the new hue
            var hue = Math.floor((coordinates.y / 256) * 360);
            var saturation = current_color.hsv.saturation;
            var value = current_color.hsv.value;

            hue = to_bounded_integer(hue, 0, 359);

            update_all_from_hsv(hue, saturation, value);
        }

        function red_change() {
            var red = local_dom.$red_input.val();
            var green = current_color.rgb.green;
            var blue = current_color.rgb.blue;

            red = to_bounded_integer(red, 0, 255);

            update_all_from_rgb(red, green, blue);
        }

        function green_change() {
            var red = current_color.rgb.red;
            var green = local_dom.$green_input.val();
            var blue = current_color.rgb.blue;

            green = to_bounded_integer(green, 0, 255);
            
            update_all_from_rgb(red, green, blue);
        }

        function blue_change() {
            var red = current_color.rgb.red;
            var green = current_color.rgb.green;
            var blue = local_dom.$blue_input.val();

            blue = to_bounded_integer(blue, 0, 255);
            
            update_all_from_rgb(red, green, blue);
        }

        function hue_change() {
            var hue = local_dom.$hue_input.val();
            var saturation = current_color.hsv.saturation;
            var value = current_color.hsv.value;

            hue = to_bounded_integer(hue, 0, 359);
            
            update_all_from_hsv(hue, saturation, value);
        }

        function saturation_change() {
            var hue = current_color.hsv.hue;
            var saturation = local_dom.$saturation_input.val();
            var value = current_color.hsv.value;

            saturation = to_bounded_integer(saturation, 0, 100);

            update_all_from_hsv(hue, saturation, value);
        }

        function value_change() {
            var hue = current_color.hsv.hue;
            var saturation = current_color.hsv.saturation;
            var value = local_dom.$value_input.val();

            value = to_bounded_integer(value, 0, 100);
            
            update_all_from_hsv(hue, saturation, value);
        }

        function cyan_change() {
            var cyan = local_dom.$cyan_input.val();
            var magenta = current_color.cmyk.magenta;
            var yellow = current_color.cmyk.yellow;
            var black = current_color.cmyk.black;

            cyan = to_bounded_number(cyan, 0, 100);
            
            update_all_from_cmyk(cyan, magenta, yellow, black);
        }

        function magenta_change() {
            var cyan = current_color.cmyk.cyan;
            var magenta = local_dom.$magenta_input.val();
            var yellow = current_color.cmyk.yellow;
            var black = current_color.cmyk.black;

            magenta = to_bounded_number(magenta, 0, 100);
            
            update_all_from_cmyk(cyan, magenta, yellow, black);
        }

        function yellow_change() {
            var cyan = current_color.cmyk.cyan;
            var magenta = current_color.cmyk.magenta;
            var yellow = local_dom.$yellow_input.val();
            var black = current_color.cmyk.black;

            yellow = to_bounded_number(yellow, 0, 100);
            
            update_all_from_cmyk(cyan, magenta, yellow, black);
        }

        function black_change() {
            var cyan = current_color.cmyk.cyan;
            var magenta = current_color.cmyk.magenta;
            var yellow = current_color.cmyk.yellow;
            var black = local_dom.$black_input.val();

            black = to_bounded_number(black, 0, 100);
            
            update_all_from_cmyk(cyan, magenta, yellow, black);
        }

        function hex_change() {
            var hex = local_dom.$hex_input.val();

            //There are a few ways a new hex string could look and still be valid. It may more may
            //  not start with a '#' character, and it may contain some combination of uppercase and
            //  lowercase letters. It can also contain either three or six hex numerals. Any other
            //  number and the string is either too long, or ambiguous (e.g. #abc -> #0a0b0c, but
            //  #abcd -> #0a0bcd or #a0bcd and so on).
            if (hex.charAt(0) === '#') hex = hex.substring(1);
            if (/^[0-9a-f]+$/i.test(hex)) {
                if (hex.length === 3)
                    hex = '0' + hex.charAt(0) + '0' + hex.charAt(1) + '0' + hex.charAt(2);
                if (hex.length === 6)
                    update_all_from_hex(hex);
                else
                    update_all_from_hex(current_color.hex.substring(1));
            } else
                update_all_from_hex(current_color.hex.substring(1));
        }

        function palette_change() {
            palette_type = local_dom.$palette_select.val();
            update_palette();
        }

        //Calculates the correct positions for the draggable markers in the hue and saturation/value
        //  pickers, relative to the picker.
        function get_marker_positions(hsv) {
            var markers = {
                hue: {
                    y: Math.round((hsv.hue / 360) * 256) + 10
                },
                saturation_value: {
                    x: Math.round((hsv.saturation / 100) * 256) + 3,
                    y: 256 - Math.round((hsv.value / 100) * 256) + 10
                }
            };

            return markers;
        }

        function update_all_from_hsv(hue, saturation, value) {
            current_color = get_all_colors_from_hsv(hue, saturation, value);
            markers = get_marker_positions(current_color.hsv);
            update_all();
        }

        function update_all_from_rgb(red, green, blue) {
            current_color = get_all_colors_from_rgb(red, green, blue);
            markers = get_marker_positions(current_color.hsv);
            update_all();
        }

        function update_all_from_cmyk(cyan, magenta, yellow, black) {
            current_color = get_all_colors_from_cmyk(cyan, magenta, yellow, black);
            markers = get_marker_positions(current_color.hsv);
            update_all();
        }

        function update_all_from_hex(hex) {
            var rgb = convert_hex_to_rgb(hex);
            current_color = get_all_colors_from_rgb(rgb.red, rgb.green, rgb.blue);
            markers = get_marker_positions(current_color.hsv);
            update_all();
        }

        function get_all_colors_from_hsv(hue, saturation, value) {
            var hsv = {
                hue: hue,
                saturation: saturation,
                value: value
            };
            var rgb = convert_hsv_to_rgb(hue, saturation, value);
            var cmyk = convert_rgb_to_cmyk(rgb.red, rgb.green, rgb.blue);
            var hex = convert_rgb_to_hex(rgb.red, rgb.green, rgb.blue);
            var hex_hue = convert_hsv_to_hex(hue, 100, 100);
            var palette = generate_palette(hsv, palette_type);

            var colors = {
                rgb: rgb,
                hsv: hsv,
                cmyk: cmyk,
                hex: hex,
                hex_hue: hex_hue,
                palette: palette
            };

            return colors;
        }

        function get_all_colors_from_rgb(red, green, blue) {
            var rgb = {
                red: red,
                green: green,
                blue: blue
            };
            var hsv = convert_rgb_to_hsv(red, green, blue);
            var cmyk = convert_rgb_to_cmyk(red, green, blue);
            var hex = convert_rgb_to_hex(red, green, blue);
            var hex_hue = convert_hsv_to_hex(hsv.hue, 100, 100);
            var palette = generate_palette(hsv, palette_type);

            var colors = {
                rgb: rgb,
                hsv: hsv,
                cmyk: cmyk,
                hex: hex,
                hex_hue: hex_hue,
                palette: palette
            };

            return colors;
        }

        function get_all_colors_from_cmyk(cyan, magenta, yellow, black) {
            var cmyk = {
                cyan: cyan,
                magenta: magenta,
                yellow: yellow,
                black: black
            };
            var rgb = convert_cmyk_to_rgb(cyan, magenta, yellow, black);
            var hsv = convert_rgb_to_hsv(rgb.red, rgb.green, rgb.blue);
            var hex = convert_rgb_to_hex(rgb.red, rgb.green, rgb.blue);
            var hex_hue = convert_hsv_to_hex(hsv.hue, 100, 100);
            var palette = generate_palette(hsv, palette_type);

            var colors = {
                rgb: rgb,
                hsv: hsv,
                cmyk: cmyk,
                hex: hex,
                hex_hue: hex_hue,
                palette: palette
            };

            return colors;
        }

        function generate_palette(hsv, type) {
            var hue = [];
            var saturation = [];
            var value = [];

            switch (type) {
                case 'triad':
                    hue = [(hsv.hue + 210) % 360, (hsv.hue + 150) % 360, (hsv.hue + 180) % 360];
                    saturation = [hsv.saturation, hsv.saturation, hsv.saturation];
                    value = [hsv.value, hsv.value, hsv.value];
                    break;
                case 'tetrad':
                    hue = [(hsv.hue + 30) % 360, (hsv.hue + 180) % 360, (hsv.hue + 210) % 360];
                    saturation = [hsv.saturation, hsv.saturation, hsv.saturation];
                    value = [hsv.value, hsv.value, hsv.value];
                    break;
                case 'adjacent': //fall through
                default:
                    hue = [(hsv.hue + 30) % 360, (hsv.hue + 330) % 360, (hsv.hue + 180) % 360];
                    saturation = [hsv.saturation, hsv.saturation, hsv.saturation];
                    value = [hsv.value, hsv.value, hsv.value];
                    break;
            }

            var palette = [];
            for (var i = 0; i < hue.length; i++)
                palette.push(convert_hsv_to_hex(hue[i], saturation[i], value[i]));

            return palette;
        }

        function update_palette() {
            current_color.palette = generate_palette(current_color.hsv, palette_type);
            update_all();
        }

        function update_all() {
            local_dom.$red_input.val(current_color.rgb.red);
            local_dom.$green_input.val(current_color.rgb.green);
            local_dom.$blue_input.val(current_color.rgb.blue);
            local_dom.$hue_input.val(current_color.hsv.hue);
            local_dom.$saturation_input.val(current_color.hsv.saturation);
            local_dom.$value_input.val(current_color.hsv.value);
            local_dom.$cyan_input.val(current_color.cmyk.cyan);
            local_dom.$magenta_input.val(current_color.cmyk.magenta);
            local_dom.$yellow_input.val(current_color.cmyk.yellow);
            local_dom.$black_input.val(current_color.cmyk.black);
            local_dom.$hex_input.val(current_color.hex);

            local_dom.$saturation_value_picker.css('background-color', current_color.hex_hue);
            local_dom.$sample.css('background-color', current_color.hex);
            local_dom.$sample.text(current_color.hex);
            if (current_color.hsv.value < 70) {
                local_dom.$sample.addClass('dark');
                local_dom.$sample.removeClass('light');
            } else {
                local_dom.$sample.addClass('light');
                local_dom.$sample.removeClass('dark');
            }

            local_dom.$saturation_value_marker.css('top', markers.saturation_value.y);
            local_dom.$saturation_value_marker.css('left', markers.saturation_value.x);
            local_dom.$hue_marker.css('top', markers.hue.y);

            local_dom.$palette_sample.each(function(i) {
                $(this).css('background-color', current_color.palette[i]);
                $(this).text(current_color.palette[i]);
                if (current_color.hsv.value < 70) {
                    $(this).addClass('dark');
                    $(this).removeClass('light');
                } else {
                    $(this).addClass('light');
                    $(this).removeClass('dark');
                }
            });
        }

        function convert_hsv_to_rgb(hue, saturation, value) {
            var c = (value / 100) * (saturation / 100);
            var x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
            var m = (value / 100) - c;

            var red = 0, green = 0, blue = 0;
            switch (true) {
                case 0 <= hue && hue < 60:
                    red = c; green = x; blue = 0;
                    break;
                case 60 <= hue && hue < 120:
                    red = x; green = c; blue = 0;
                    break;
                case 120 <= hue && hue < 180:
                    red = 0; green = c; blue = x;
                    break;
                case 180 <= hue && hue < 240:
                    red = 0; green = x; blue = c;
                    break;
                case 240 <= hue && hue < 300:
                    red = x; green = 0; blue = c;
                    break;
                case 300 <= hue && hue < 360:
                    red = c; green = 0; blue = x;
                    break;
            }
            red = Math.floor(255 * (red + m));
            green = Math.floor(255 * (green + m));
            blue = Math.floor(255 * (blue + m));

            var rgb = {
                red: red,
                green: green,
                blue: blue
            };
            return rgb;
        }

        function convert_rgb_to_hsv(red, green, blue){
            var red_proportion = red / 255;
            var green_proportion = green / 255;
            var blue_proportion = blue / 255;
            
            var min = Math.min(red_proportion, Math.min(green_proportion, blue_proportion));
            var max = Math.max(red_proportion, Math.max(green_proportion, blue_proportion));
            var delta = max - min;
            
            var hue = 0;
            var saturation = (max > 0) ? Math.round(((max - min) * 100) / max) : 0;
            var value = Math.round(max * 100);
            if (delta > 0) {
                switch (max) {
                    case red_proportion:
                        hue = Math.round(60 * (((green_proportion - blue_proportion) / delta)));
                        break;
                    case green_proportion:
                        hue = Math.round(60 * (((blue_proportion - red_proportion) / delta) + 2));
                        break;
                    case blue_proportion:
                        hue = Math.round(60 * (((red_proportion - green_proportion) / delta) + 4));
                        break;
                }
            }
            if (hue < 0) hue += 360;
            
            var hsv = {
                hue: hue,
                saturation: saturation,
                value: value
            };

            return hsv;
        }

        function convert_rgb_to_cmyk(red, green, blue){
            var red_proportion = red / 255;
            var green_proportion = green / 255;
            var blue_proportion = blue / 255;
            
            var black = 1 - Math.max(red_proportion, Math.max(green_proportion, blue_proportion));
            var cyan = (black < 1) ? ((1 - red_proportion - black) / (1 - black)) : 0;
            var magenta = (black < 1) ? ((1 - green_proportion - black) / (1 - black)) : 0;
            var yellow = (black < 1) ? ((1 - blue_proportion - black) / (1 - black)) : 0;
            
            return {
                black: (100 * black).toFixed(1),
                cyan: (100 * cyan).toFixed(1),
                magenta: (100 * magenta).toFixed(1),
                yellow: (100 * yellow).toFixed(1)
            };
        }
    
        function convert_rgb_to_hex(red, green, blue){
            var red_string = red.toString(16);
            if (red_string.length < 2)
                red_string = '0' + red_string;
            var green_string = green.toString(16);
            if (green_string.length < 2)
                green_string = '0' + green_string;
            var blue_string = blue.toString(16);
            if (blue_string.length < 2)
                blue_string = '0' + blue_string;
            
            return '#' + red_string + green_string + blue_string;
        }

        function convert_hsv_to_hex(hue, saturation, value) {
            var rgb = convert_hsv_to_rgb(hue, saturation, value);
            var hex = convert_rgb_to_hex(rgb.red, rgb.green, rgb.blue);
            return hex;
        }

        function convert_hex_to_rgb(hex) {
            var red = parseInt(hex.substring(0,2), 16);
            var green = parseInt(hex.substring(2,4), 16);
            var blue = parseInt(hex.substring(4,6), 16);

            var rgb = {
                red: red,
                green: green,
                blue: blue
            };
            return rgb;
        }

        function convert_cmyk_to_rgb(cyan, magenta, yellow, black) {
            var c = cyan / 100;
            var m = magenta / 100;
            var y = yellow / 100;
            var k = black / 100;

            var red = Math.round(255 * (1 - c) * (1 - k));
            var green = Math.round(255 * (1 - m) * (1 - k));
            var blue = Math.round(255 * (1 - y) * (1 - k));

            var rgb = {
                red: red,
                green: green,
                blue: blue
            };
            return rgb;
        }
    
        function get_initial_color() {
            var hue = Math.floor(Math.random() * 100);
            var saturation = Math.floor(Math.random() * 100);
            var value = Math.floor(Math.random() * 100);

            var colors = get_all_colors_from_hsv(hue, saturation, value);

            return colors;
        }

        function initialize_local_dom() {
            //The container of this instant answer will be the root for all other elements.
            var $root = $('#color_picker_container');

            //Find all of the elements of interest within the instant answer.
            local_dom = {
                $saturation_value_picker: $root.find('#saturation_value_picker'),
                $hue_picker: $root.find('#hue_picker'),
                $red_input: $root.find('#red_input'),
                $green_input: $root.find('#green_input'),
                $blue_input: $root.find('#blue_input'),
                $hue_input: $root.find('#hue_input'),
                $saturation_input: $root.find('#saturation_input'),
                $value_input: $root.find('#value_input'),
                $cyan_input: $root.find('#cyan_input'),
                $magenta_input: $root.find('#magenta_input'),
                $yellow_input: $root.find('#yellow_input'),
                $black_input: $root.find('#black_input'),
                $hex_input: $root.find('#hex_input'),
                $palette_select: $root.find('#palette_select'),
                $sample: $root.find('#sample'),
                $saturation_value_marker: $root.find('#saturation_value_marker'),
                $hue_marker: $root.find('#hue_marker'),
                $palette_sample: $root.find('.palette_sample'),
                initialized: true
            };

            //Event Handling

            //For the hue and saturation/value pickers, there are a few things we need to do. First,
            //  we need to listen for click events so that a user can click anywhere in the picker
            //  to immediate jump to that color. We also need to allow the user to drag the mouse
            //  around in the pickers, so we need to keep the browser from using the default drag
            //  action on images. Then we respond to mousemove events if the mouse was already down
            //  on the picker the same way we respond to a click.
            local_dom.$saturation_value_picker.click(saturation_value_clicked);
            local_dom.$saturation_value_picker.on('dragstart', function() { event.preventDefault();});
            local_dom.$saturation_value_picker.mousedown(function() { saturation_value_mousedown = true; });
            local_dom.$saturation_value_picker.mousemove(function() { if (saturation_value_mousedown) saturation_value_clicked(); });
            local_dom.$hue_picker.click(hue_clicked);
            local_dom.$hue_picker.on('dragstart', function() { event.preventDefault();});
            local_dom.$hue_picker.mousedown(function() { hue_mousedown = true; });
            local_dom.$hue_picker.mousemove(function() { if (hue_mousedown) hue_clicked(); });
            $root.mouseup(function() { saturation_value_mousedown = false; hue_mousedown = false; });
            $root.focusout(function() { saturation_value_mousedown = false; hue_mousedown = false; });

            //Also need to listen for touchmove events for touch-enabled devices.
            local_dom.$saturation_value_picker.on('touchmove', function() { saturation_value_clicked(); event.preventDefault(); });
            local_dom.$hue_picker.on('touchmove', function() { hue_clicked(); event.preventDefault(); });

            //Listen for changes to any of the text inputs
            local_dom.$red_input.change(red_change);
            local_dom.$green_input.change(green_change);
            local_dom.$blue_input.change(blue_change);
            local_dom.$hue_input.change(hue_change);
            local_dom.$saturation_input.change(saturation_change);
            local_dom.$value_input.change(value_change);
            local_dom.$cyan_input.change(cyan_change);
            local_dom.$magenta_input.change(magenta_change);
            local_dom.$yellow_input.change(yellow_change);
            local_dom.$black_input.change(black_change);
            local_dom.$hex_input.change(hex_change);

            //Listen to changes to the selected palette type
            local_dom.$palette_select.change(palette_change);
        }
    };
}(this));