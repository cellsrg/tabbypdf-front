/**
 * Модуль, предоставляющий сервис для рендера PDF
 */
define(function () {


    var pdf, pagesCount, currentPage;

    /**
     * Основной метод сервиса. Рендерит PDF и добавляет canvas'ы со страницами к div#pages
     * @param pdfFile PDF-файл
     * @returns {*|Promise} Promise с canvas'ами страниц PDF
     */
    function handlePdf(pdfFile) {
        currentPage = 0;
        return PDFJS.getDocument(pdfFile).then(function (doc) {
            pdf = doc;
            pagesCount = pdf.numPages;
            return handlePages();
        });
    }

    /**
     * Обработка страниц PDF
     * @returns {Promise} Promise с canvas'ами
     */
    function handlePages() {
        var promises = [];
        for (var i = 1; i <= pagesCount; i++) {
            promises.push(
                pdf.getPage(i).then(renderPage).then(function (canvas) {
                    return canvas;
                })
            );
        }
        return Promise.all(promises);
    }

    /**
     * Рендер страницы
     * @param page Страница
     * @returns {*|Promise} Promise с canvas'ом
     */
    function renderPage(page) {
        var viewport = page.getViewport(1);
        viewport = page.getViewport(($("#pdfContainer").width() - 100) / viewport.width);
        var canvas = document.createElement('canvas');
        canvas.id = currentPage++;
        var ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        return page.render({canvasContext: ctx, viewport: viewport}).then(function () {
            return canvas
        })
    }

    return {
        renderPdf: handlePdf
    };
});