define([
    "Config"
],function (config) {
    var root = config.apiRoot;
    var uploadUrl = root + "/api/upload";
    var extractUrl = root + "/api/extract";
    var downloadUrl = root + "/api/download";
    var annotateUrl = root + "/api/annotate";

    var POST = "POST";
    var GET = "GET";

    var exports = {
        uploadFile: function (file) {
            var formData = new FormData();
            formData.append("file", file);

            return makeRequest(POST, uploadUrl, formData)
                .then(function (response) {
                    return JSON.parse(response);
                });
        },

        extract: function (extractData) {
            return makeRequest(POST, extractUrl, JSON.stringify(extractData), true)
                .then(function (response) {
                    return JSON.parse(response);
                });
        },

        downloadFile: function (fileId) {
            var url = downloadUrl + "/" + fileId;
            $.ajax({
                url: url,
                type: GET,
                success: function () {
                    window.location = url;
                }
            });
        },

        annotate: function (data) {
            makeRequest(POST, annotateUrl, JSON.stringify(data), true).then(function (response) {
                window.location = downloadUrl + "/" + response;
            });
        },

        makeRequest: makeRequest
    };

    function makeRequest (method, url, data, isJson) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url);
                if (isJson) {
                    xhr.setRequestHeader("Content-Type", "application/json")
                }
                xhr.onload = function () {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject({
                            status: this.status,
                            statusText: xhr.statusText
                        });
                    }
                };
                xhr.onerror = function () {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                try {
                    xhr.send(data);
                } catch (e) {
                    console.log(e);
                }
            }, 200);
        });
    }

    return exports;
});
