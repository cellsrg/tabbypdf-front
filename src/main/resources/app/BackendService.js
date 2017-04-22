define(function () {
    var root = "";//"pdfte";
    var uploadUrl = root + "/api/upload";
    var extractUrl = root + "/api/extract";
    var downloadUrl = root + "/api/download";

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
            var formData = new FormData();
            formData.append("data", JSON.stringify(extractData));

            return makeRequest(POST, extractUrl, formData)
                .then(function (response) {
                    return JSON.parse(response);
                });
        },

        downloadFile: function (fileId) {
            var url = downloadUrl + "/" + fileId;
            $.ajax({
                url: url,
                type: "GET",
                success: function () {
                    window.location = url;
                }
            });
        },

        makeRequest: makeRequest
    };

    function makeRequest (method, url, data) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url);
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
                xhr.send(data);
            }, 200);
        });
    }

    return exports;
});