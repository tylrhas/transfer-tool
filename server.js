var express = require('express')
var fs = require("fs")
var path = require("path")
var zipFolder = require('zip-folder');
var bodyParser = require('body-parser');
var app = express()
request = require('request')
var URL = process.env.appURL


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.set('port', (process.env.PORT || 5000))
//run function to set up required folders
appSetUp()
//set the contents of the public folder to be accessable to the public
app.use(express.static(__dirname + '/public'))

app.post('/downloadassets', function (req, res) {
    urls = req.body
    dirName = createDir();
    for (i = 0; i < urls.length; i++) {
        //console.log(urls.assets[i]['secure_url']);
        downloadImages(urls[i], dirName, i);
    }
    //listen for event
    zipLocation = URL + '/assets/' + dirName + '.zip';
    res.json({
        'url': zipLocation,
        'status': 'sucess'
    });
});

app.listen(app.get('port'), function () {
    console.log('Reporting Server is running on port', app.get('port'))
});

function appSetUp() {
    //create the public folder and the assets folder 
    if (!fs.existsSync('public')) {
        fs.mkdirSync('public');
    }

    if (!fs.existsSync('public/assets')) {
        fs.mkdirSync('public/assets');
    }
}

function downloadImages(url, dirName, i) {

    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream('./public/assets/' + dirName + "/" + filename)).on('close', callback);
        });
    };
    download(url, getFileName(url), function () {
        console.log('done');
        if (i === urls.length - 1) {
            console.log('all done');
            zipFolder('./public/assets/' + dirName, './public/assets/' + dirName + '.zip', function (err) {
                if (err) {
                    console.log('oh no!', err);
                } else {
                    console.log('EXCELLENT');
                }
            });
        }
    });

}

function getFileName(url) {
    //split the url to just get the file name
    urlSplit = url.split("/");
    index = urlSplit.length - 1;
    //strip off the id that cloudinary adds
    splitFileName = urlSplit[index].split('.');
    newfile = splitFileName[0].substring(0, splitFileName[0].length - 7);
    //add the file extension back in
    fileWithFormat = newfile + '.' + splitFileName[1];
    return fileWithFormat;
}

function createDir() {
    var date = new Date();
    var datetime = date.getFullYear() + "-" + date.getDay() + "-" + date.getMonth() + "-" + date.getTime();
    var dir = 'asset_download-' + datetime;
    if (!fs.existsSync('./public/assets/' + dir)) {
        fs.mkdirSync('./public/assets/' + dir);
    }
    return dir;
}
