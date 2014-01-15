//
// stemming_demo.js
//
// Demo for stemming_algorithm.js
// 
// Author: Jason Fleet (jason.fleet@googlemail.com)
//
// 2014.01.15
//
// Copyright (c) 2014 Jason Fleet
//
// Requirements:
//  jQuery
//

$(document).ready(function()
{
    var cells = [];
    var psAlogrithm = new PSAlogrithm();
    var stemmedWord = "";
    var word = "";
    var words;

    $('#stemming button').on('click', function()
    {
        words = $('#stem-source').val().toLowerCase().split(/[^a-z]/);

        $('#stem-result').empty();

        for (var i = 0, j = words.length; i < j; i++)
        {
            word = words[i].toLowerCase();

            if (word != "")
            {
                stemmedWord = psAlogrithm.stem(word);
                $('#stem-result').append('<span>' + word + '</span>' + stemmedWord + '<br />');
            }
        }
    });
});