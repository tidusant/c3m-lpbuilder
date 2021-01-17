import LZString from 'lz-string'
export function makeid(num) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < num; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function base64encode(input) {
    //return btoa( unescape( encodeURIComponent( input ) ) );
    //return Buffer.from(unescape(encodeURIComponent(input))).toString('base64');
    return Buffer.from(input).toString('base64');
}

function base64decode(input) {
    if (input === undefined || input === null || input.trim() === "") return "";
    //return decodeURIComponent( escape( atob( input ) ) );
    return Buffer.from(input, 'base64').toString();
}

export function encDat2(data, oddnumber) {

    if (data === undefined || data.trim() === "") return "";
    if (oddnumber === undefined) oddnumber = 5;
    oddnumber = 10;
    var l = Math.floor((Math.random() * data.length) + 1);//random from 1 to data len

    let x = makeid(oddnumber);
    // mylog('random x string:'+x);
    let y = base64encode(x);
    y = y.replace(/=/g, "");
    // mylog('yb64:'+y);
    data = data.substring(0, l) + y + data.substring(l);
    // mylog('datay:'+data);
    //data=LZString["compressToBase64"](data);
    data = base64encode(data);
    //mylog("lzjs: "+detailurl);
    //data=data.replace(/===/g,"A==");
    data = data.replace(/=/g, "");
    // mylog('data compress:'+data);
    // mylog('data final:'+x+data);
    return x + data
}

export function decDat(data, compress) {
    let key = data;
    if (key === "") return '';

    let oddstr = 'd';
    let div = 8;
    if (compress) div = 2;
    let l = Math.floor((key.length - 2) / div);
    //console.log("l",l)
    let x2 = key.substr(l, 2);
    key = key.substr(0, l) + key.substr(l + 2);
    //console.log("num: "+num);
    x2 = base64decode(x2) * 1;

    //console.log("x2: "+x2);
    if (x2 > 0) {
        //print_r($num);print_r("\r\n");
        //get odd string
        let lf=Math.ceil(key.length / x2);
        //console.log("lf:",lf)
        oddstr = key.substr(0, lf);

        let ukey = key.replace(oddstr, '');
        let base64 = '';

        for (let i = oddstr.length - 1; i >= 0; i--) {
            base64 += oddstr.substr(oddstr.length - 1);
            oddstr = oddstr.substr(0, oddstr.length - 1);

            if (ukey.length - x2 + 1 > 0)
                base64 += (ukey.substr(ukey.length - x2 + 1)).split("").reverse().join("");
            else
                base64 += ukey.split("").reverse().join("");
            if (i > 0) {
                ukey = ukey.substr(0, ukey.length - x2 + 1);
            }

        }
        base64 = base64.substr(0, base64.length - x2);
        //console.log("base64",base64)
        if (compress) {
            data = LZString["decompressFromBase64"](base64);
        }
        else data = base64decode(base64);

        return data;
    }
    return '';
}
// function decDatNew(data,keysalt){
//
//     keysalt=base64encode(keysalt);
//
//     keysalt=keysalt.replace(/=/g,"");
//
//     data=data.replace(keysalt,'');
//     return LZString["decompressFromBase64"](data);
// }
//
// function lzw_decode(s) {
//     let dict = {};
//     let data = (s + "").split("");
//     let currChar = data[0];
//     let oldPhrase = currChar;
//     let out = [currChar];
//     let code = 256;
//     let phrase;
//     for (let i=1; i<data.length; i++) {
//         let currCode = data[i].charCodeAt(0);
//         if (currCode < 256) {
//             phrase = data[i];
//         }
//         else {
//             phrase = dict['_'+currCode] ? dict['_'+currCode] : (oldPhrase + currChar);
//         }
//         out.push(phrase);
//         currChar = phrase.charAt(0);
//         dict['_'+code] = oldPhrase + currChar;
//         code++;
//         oldPhrase = phrase;
//     }
//     return out.join("");
// }