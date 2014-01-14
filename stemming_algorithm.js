//
// stemming_algorithm.js
//
// An implementation of the Proter Stemming algorithm.
// It's close to the ANSI C version.
//
//
// author: Jason Fleet (jason.fleet@googlemail.com)
//
// 2014.01.01
//
// Copyright (c) 2014 Jason Fleet
//
// Requirements:
//  jQuery
//
// References:
//  http://tartarus.org/~martin/PorterStemmer/index.html
//

var PSAlogrithm = function()
{
    // buffer for word to be stemmed
    this.b = [];
    this.j = 0;
    this.k = 0;

    // returns true if it is a consonant?
    this.cons = function(i)
    {
        var isCons = false;

        switch (this.b[i])
        {
            case 'a':
            case 'e':
            case 'i':
            case 'o':
            case 'u':
                isCons = false;
                break;
            case 'y':
                isCons = (i == 0) ? true : !this.cons(i - 1);
                break;
            default:
                isCons = true;
        }

        return isCons;
    }
    /* cvc(i) is TRUE <=> i-2,i-1,i has the form consonant - vowel - consonant
     and also if the second c is not w,x or y. this is used when trying to
     restore an e at the end of a short word. e.g.

     cav(e), lov(e), hop(e), crim(e), but
     snow, box, tray.

     */

    this.cvc = function(i)
    {
        var ch = this.b[i];
        var res = true;

        if (i < 2 || !this.cons(i - 2) || this.cons(i - 1) || !this.cons(i))
        {
            res = false;
        }
        else
        {
            if (ch == 'w' || ch == 'x' || ch == 'y')
            {
                res = false;
            }
        }
        return res;
    }
    /* doublec(j) is TRUE <=> j,(j-1) contain a double consonant. */
    this.doublec = function(j)
    {
        var res = true;

        if (j < 1 || this.b[j] != this.b[j - 1])
        {
            res = false;
        }
        else
        {
            res = this.cons(j);
        }
        return res;
    }
    /* ends(s) is TRUE <=> k0,...k ends with the string s. */
    this.ends = function(s)
    {
        var ls = s.length;
        var p;
        var res = false;

        if (s[ls - 1] == this.b[this.k] && ls < this.k + 1)
        {
            p = this.b.slice(this.k - (ls - 1), this.k + 1);
            if (p == s)
            {
                res = true;
                this.j = this.k - ls;
            }
        }

        return res;
    }
    /* m() measures the number of consonant sequences between k0 and j. if c is
     a consonant sequence and v a vowel sequence, and <..> indicates arbitrary
     presence,

     <c><v>       gives 0
     <c>vc<v>     gives 1
     <c>vcvc<v>   gives 2
     <c>vcvcvc<v> gives 3
     ....
     */
    this.m = function()
    {
        var n = 0;
        var i = 0;

        while (this.cons(i))
        {
            if (i > this.j)
                return n;
            i++;
        }

        i++;

        while (true)
        {
            while (true)
            {
                if (i > this.j)
                    return n;
                if (this.cons(i))
                    break;
                i++;
            }

            n++;

            i++;

            while (true)
            {
                if (i > this.j)
                    return n;
                if (!this.cons(i))
                    break;
                i++;
            }
            i++;
        }

        return n;
    }
    /* r(s) is used further down. */
    this.r = function(s)
    {
        if (this.m() > 0)
        {
            this.setto(s);
        }
    }
    // setto(s) sets (j+1),...k to the characters in the string s, readjusting k.
    this.setto = function(s)
    {
        var l = s.length;

        this.b = this.b.slice(0, this.j + 1);

        for (var i = 0; i < l; i++)
        {
            this.b += s.charAt(i);
        }

        this.k = this.j + l;
    }
    /* In stem(p,i,j), p is a char pointer, and the string to be stemmed is from
     p[i] to p[j] inclusive. Typically i is zero and j is the offset to the last
     character of a string, (p[j+1] == '\0'). The stemmer adjusts the
     characters p[i] ... p[j] and returns the new end-point of the string, k.
     Stemming never increases word length, so i <= k <= j. To turn the stemmer
     into a module, declare 'stem' as extern, and delete the remainder of this
     file.
   */
    this.stem = function(b)
    {
        var stemmed;

        this.b = b;

        this.k = this.b.length - 1;

        if (this.k > 1)
        {
            this.step1ab();
            this.step1c();
            this.step2();
            this.step3();
            this.step4();
            this.step5();
        }

        stemmed = this.b.slice(0, this.k + 1);

        return stemmed;
    }
    /* step1ab() gets rid of plurals and -ed or -ing. e.g. */
    this.step1ab = function()
    {
        if (this.b[this.k] == 's')
        {
            if (this.ends("sses"))
            {
                this.k -= 2;
            }
            else if (this.ends("ies"))
            {
                this.setto("i");
            }
            else if (this.b[this.k - 1] != 's')
            {
                this.k--;
            }
        }
        if (this.ends("eed"))
        {
            if (this.m() > 0)
            {
                this.k--;
            }
        }
        else if ((this.ends("ed") || this.ends("ing")) && this.vowelinstem())
        {
            this.k = this.j;

            if (this.ends("at"))
            {
                this.setto("ate");
            }
            else if (this.ends("bl"))
            {
                this.setto("ble");
            }
            else if (this.ends("iz"))
            {
                this.setto("ize");
            }
            else if (this.doublec(this.k))
            {
                this.k--;
                {
                    var ch = this.b[this.k];
                    if (ch == 'l' || ch == 's' || ch == 'z')
                        this.k++;
                }
            }
            else if (this.m() == 1 && this.cvc(this.k))
                this.setto("e");
        }
    }
    // step1c() turns terminal y to i when there is another vowel in the stem.
    this.step1c = function()
    {
        if (this.ends("y") && this.vowelinstem())
        {
            this.b = this.b.slice(0, this.k) + 'i';
        }
    }
    // step2() maps double suffices to single ones. so -ization ( = -ize plus
    // -ation) maps to -ize etc. note that the string before the suffix must give
    // m() > 0.
    this.step2 = function()
    {
        switch (this.b[this.k - 1])
        {
            case 'a':
                if (this.ends("ational"))
                {
                    this.r("ate");
                    break;
                }
                if (this.ends("tional"))
                {
                    this.r("tion");
                    break;
                }
                break;
            case 'c':
                if (this.ends("enci"))
                {
                    this.r("ence");
                    break;
                }
                if (this.ends("anci"))
                {
                    this.r("ance");
                    break;
                }
                break;
            case 'e':
                if (this.ends("izer"))
                {
                    this.r("ize");
                    break;
                }
                break;

            case 'l':
                if (this.ends("abli"))
                {
                    this.r("able");
                    break;
                }

                if (this.ends("alli"))
                {
                    this.r("al");
                    break;
                }
                if (this.ends("entli"))
                {
                    this.r("ent");
                    break;
                }
                if (this.ends("eli"))
                {
                    this.r("e");
                    break;
                }
                if (this.ends("ousli"))
                {
                    this.r("ous");
                    break;
                }
                break;
            case 'o':
                if (this.ends("ization"))
                {
                    this.r("ize");
                    break;
                }
                if (this.ends("ation"))
                {
                    this.r("ate");
                    break;
                }
                if (this.ends("ator"))
                {
                    this.r("ate");
                    break;
                }
                break;
            case 's':
                if (this.ends("alism"))
                {
                    this.r("al");
                    break;
                }
                if (this.ends("iveness"))
                {
                    this.r("ive");
                    break;
                }
                if (this.ends("fulness"))
                {
                    this.r("ful");
                    break;
                }
                if (this.ends("ousness"))
                {
                    this.r("ous");
                    break;
                }
                break;
            case 't':
                if (this.ends("aliti"))
                {
                    this.r("al");
                    break;
                }
                if (this.ends("iviti"))
                {
                    this.r("ive");
                    break;
                }
                if (this.ends("biliti"))
                {
                    this.r("ble");
                    break;
                }
                break;
            case 'g':
                if (this.ends("logi"))
                {
                    this.r("log");
                    break;
                } //-DEPARTURE-

        }
    }
    // step3() deals with -ic-, -full, -ness etc. similar strategy to step2.
    this.step3 = function()
    {
        switch (this.b[this.k])
        {
            case 'e':
                if (this.ends("icate"))
                {
                    this.r("ic");
                    break;
                }
                if (this.ends("ative"))
                {
                    this.r("");
                    break;
                }
                if (this.ends("alize"))
                {
                    this.r("al");
                    break;
                }
                break;
            case 'i':
                if (this.ends("iciti"))
                {
                    this.r("ic");
                    break;
                }
                break;
            case 'l':
                if (this.ends("ical"))
                {
                    this.r("ic");
                    break;
                }
                if (this.ends("ful"))
                {
                    this.r("");
                    break;
                }
                break;
            case 's':
                if (this.ends("ness"))
                {
                    this.r("");
                    break;
                }
                break;
        }
    }
    // step4() takes off -ant, -ence etc., in context <c>vcvc<v>.
    this.step4 = function()
    {
        switch (this.b[this.k - 1])
        {
            case 'a':
                if (this.ends("al"))
                    break;
                return;
            case 'c':
                if (this.ends("ance"))
                    break;
                if (this.ends("ence"))
                    break;
                return;
            case 'e':
                if (this.ends("er"))
                    break;
                return;
            case 'i':
                if (this.ends("ic"))
                    break;
                return;
            case 'l':
                if (this.ends("able"))
                    break;
                if (this.ends("ible"))
                    break;
                return;
            case 'n':
                if (this.ends("ant"))
                    break;
                if (this.ends("ement"))
                    break;
                if (this.ends("ment"))
                    break;
                if (this.ends("ent"))
                    break;
                return;
            case 'o':
                if (this.ends("ion") && this.j >= 0 && (this.b[this.j] == 's' || this.b[this.j] == 't'))
                    break;
                if (this.ends("ou"))
                    break;
                return;
            // takes care of -ous
            case 's':
                if (this.ends("ism"))
                    break;
                return;
            case 't':
                if (this.ends("ate"))
                    break;
                if (this.ends("iti"))
                    break;
                return;
            case 'u':
                if (this.ends("ous"))
                    break;
                return;
            case 'v':
                if (this.ends("ive"))
                    break;
                return;
            case 'z':
                if (this.ends("ize"))
                    break;
                return;
            default:
                return;
        }
        if (this.m() > 1)
            this.k = this.j;
    }
    // step5() removes a final -e if m() > 1, and changes -ll to -l if m() > 1.
    this.step5 = function()
    {
        this.j = this.k;

        if (this.b[this.k] == 'e')
        {
            var a = this.m();

            if (a > 1 || a == 1 && !this.cvc(this.k - 1))
            {
                this.k--;
            }
        }
        if (this.b[this.k] == 'l' && this.doublec(this.k) && this.m() > 1)
        {
            this.k--;
        }
    }
    /* vowelinstem() is TRUE <=> k0,...j contains a vowel */
    this.vowelinstem = function()
    {
        var res = false;

        for (var i = 0; i <= this.j && !res; i++)
        {
            if (!this.cons(i))
            {
                res = true;
            }
        }

        return res;
    }
}

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

