requirejs.config({
    baseUrl: 'app',
    paths: {
        app: '../app'
    }
});
requirejs(['app/Main']);
