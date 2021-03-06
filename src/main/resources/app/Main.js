/**
 * Основной модуль
 */
define(
    [
        "BackendService",
        "DrawingService",
        "PdfRenderService",
        "Rectangle"
    ],
    function (backendService, DrawingService, PdfRenderService, Rectangle) {

        // хранит данные о страницах и выделенных областях
        var data = {};

        // прячем лишние кнопки при запуске приложения
        $("#htmlContainer").hide();
        $("#pdfContainer").show();

        // отобразить контейнер с pdf-кой
        $("#showPdf").click(function () {
            $("#showPdf").hide();
            $("#showTables").show();
            $("#pdfContainer").show();

        });

        // отобразить контейнер с html-таблицами
        $("#showTables").click(function () {
            $("#showPdf").show();
            $("#showTables").hide();
            $("#pdfContainer").hide();
            $("#htmlContainer").show();
        });

        $("#annotate").click(function () {
            backendService.annotate(prepareExtractionData())
        });


        /**
         * при выборе нового файла прячем лишние кнопки, сбрасываем данные, очищаем контейнеры с pdf и таблицами
         * затем обрабатываем выбранный файл
         */
        $("#file").change(function (event) {
            if (event.target.files.length == 1) {
                $("#extract").hide();
                $("#annotate").hide();
                $("#showPdf").hide();
                $("#showTables").hide();
                $("#downloadResults").hide();
                $("#pages").empty();
                var $htmlContainer = $("#htmlContainer");
                $htmlContainer.hide();
                $htmlContainer.empty();
                $("#pdfContainer").show();

                data = {};
                var file = event.target.files[0];
                processFile(file);
            }
            event.target.value = null;
        });

        // запрет включения скролла средней кнопкой мыши
        document.body.onmousedown = function (e) {
            if (e.button === 1) return false;
        };

        /**
         * при нажатии на "Extract", подготавливаем данные для передачи на сервер, отправляем запрос, и обрабатываем
         * пришедшие с сервера таблицы
         */
        $("#extract").click(function () {
            $("#showPdf").hide();
            $("#showTables").hide();
            $("#htmlContainer").empty();

            var extractData = prepareExtractionData();

            $("#pdfContainer").addClass("loading");
            backendService.extract(extractData).then(function (json) {
                var pages = json.pages;
                for (var i = 0; i < pages.length; i++) {
                    var page = json.pages[i];
                    var pageId = page.pageNumber;

                    var pageSegment = $("<div class='ui segments'><h4>Page #" + (1 + pageId) + "</h4></div>");

                    var tables = page.tables;
                    for (var tableId = 0; tableId < tables.length; tableId++) {
                        var tableSegment = $("<div class='ui segment'><h5>Table #" + (1 + tableId) + "</h5></div>");
                        var table = $(tables[tableId].html);
                        table.addClass("ui celled table");
                        table.appendTo(tableSegment);
                        pageSegment.append(tableSegment);
                    }
                    pageSegment.appendTo("#htmlContainer");
                }

                var $pdfContainer = $("#pdfContainer");
                $pdfContainer.removeClass("loading");
                $pdfContainer.hide();
                $("#htmlContainer").show();
                $("#showPdf").show();

                var resultId = json.resultId;
                if (resultId) {
                    var $downloadResults = $("#downloadResults");
                    $downloadResults.show();
                    $downloadResults.off("click");
                    $downloadResults.click(function () {
                        backendService.downloadFile(resultId);
                    });
                }
            });
        });

        //подготовка данных о выделенных областях для передачи на сервер
        function prepareExtractionData() {
            var extractData = {pages: []};
            Object.keys(data).forEach(function (id) {
                if (id !== "fileId") {
                    var pageData = {
                        pageNumber: id,
                        tables: []
                    };
                    extractData.pages[id] = pageData;
                    var rects = data[id].rectangles;
                    Object.keys(rects).forEach(function (rectId) {
                        pageData.tables[rectId] = {
                            left: rects[rectId].x1 / data[id].canvas.width,
                            right: rects[rectId].x2 / data[id].canvas.width,
                            top: (data[id].canvas.height - rects[rectId].y1) / data[id].canvas.height,
                            bottom: (data[id].canvas.height - rects[rectId].y2) / data[id].canvas.height
                        };
                    });
                } else {
                    extractData["id"] = data[id];
                }
            });
            return extractData;
        }

        /**
         * Рендеринг pdf и обнаружение таблиц
         * @param file PDF-файл
         */
        function processFile(file) {

            $("#pdfContainer").addClass("loading");

            var reader = new FileReader();
            reader.onload = function () {
                //сначала рендерим pdf
                var arrayBuffer = this.result;
                PdfRenderService.renderPdf(new Uint8Array(arrayBuffer)).then(function (canvases) {

                    //потом сортируем canvas'ы на странице
                    canvases.sort(function (a, b) {
                        return parseInt(a.id) - parseInt(b.id);
                    }).forEach(function (canvas) {
                        $(canvas).remove();
                        $(canvas).appendTo("#pages");
                    });

                    /*
                        отправляем pdf'ку на сервер, взамен получаем json следующего вида
                        {
                            id: <идентификатор pdf'ки>,
                            pages: {
                                0: {        <страница 0>
                                    0: {    <таблица 0>
                                        bottom: <число>,
                                        left: <число>,
                                        right: <число>,
                                        top: <число>
                                    },
                                    1: ...
                                },
                                1: ...
                            }
                        }
                     */
                    backendService.uploadFile(file).then(function (response) {
                        processResponse(response);

                        var $pdfContainer = $("#pdfContainer");
                        $pdfContainer.removeClass("loading");
                        $pdfContainer.show();
                        $("#extract").show();
                        $("#annotate").show();
                    })

                });
            };
            reader.readAsArrayBuffer(file);
        }

        // обработка данных с сервера о найденных таблицах
        function processResponse(json) {
            data.fileId = json.id;
            var pages = json.pages;
            for (var i = 0; i < pages.length; i++) {
                var pageNumber = pages[i].pageNumber;
                var canvas = $("#pages").find("canvas#" + pageNumber)[0];
                data[pageNumber] = {
                    canvas: canvas,
                    image: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height),
                    rectangles: {}
                };

                createRectangles(pages[i], canvas, pageNumber);
            };
            DrawingService.setData(data);
        }

        function createRectangles(responsePage, canvas, pageNumber) {
            var tables = responsePage.tables;
            for (var tableNumber = 0; tableNumber < tables.length; tableNumber++) {
                var table = tables[tableNumber];

                var rectangle = new Rectangle(
                    table.left * canvas.width,
                    canvas.height - table.top * canvas.height,
                    table.right * canvas.width,
                    canvas.height - table.bottom * canvas.height
                );

                rectangle.draw(
                    canvas,
                    canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
                );

                data[pageNumber].rectangles[tableNumber] = rectangle;
            }
        }
    }
);
