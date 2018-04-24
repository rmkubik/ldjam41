class UrlHelper {

    constructor(window) {
        let queryString;
        if (this.inIFrame(window)) {
            const a = document.createElement('a');
            a.href = window.document.referrer;
            this.baseURL = a.origin + a.pathname;
            queryString = a.search;
        } else {
            this.baseURL = window.location.origin + window.location.pathname;
            queryString = window.location.search;
        }

        this.params = this.parseQueryParams(queryString);
    }

    inIFrame(window) {
        return window !== window.parent;
    }

    parseQueryParams(queryString) {
        const splitParamStrings = str => str.split('&');
        const paramStrings = splitParamStrings(queryString.substring(1));

        return paramStrings.reduce((params, string) => {
            const [key, val] = string.split('=');
            params[key] = val;
            return params;
        }, {});
    }
}
