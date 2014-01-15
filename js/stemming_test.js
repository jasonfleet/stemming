//
// stemming_test.js
//
// Test for stemming_algorithm.js
//
// Adds a 3 column table to a tag with id="stem-test".
//
//       col 0            col 1            col 2
//    word to stem | expected result | actual result
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

    $('#stem-test tr').each(function()
    {
        cells = $(this).children();

        word = $(cells[0]).html();

        stemmedWord = psAlogrithm.stem(word);

        $(cells[2]).html(stemmedWord);
        
        if (stemmedWord == $(cells[2]).html())
        {
            $(cells[2]).css('color', 'green');
        }
        else
        {
            $(cells[2]).css('background', 'red');
        }
    });
});
