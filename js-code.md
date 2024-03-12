* 手写ajax

```javascript
function createXHR() {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    } else {
        return new ActiveXObject();
    }
}

function objectToString(obj) {
    const res = [];
    for (const [key, value] of Object.entries(obj)) {
        res.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
    return res.join('&');
}

function ajax({ type = 'get', url, data = {}, dataType = 'json' }) {
    const xhr = createXHR();
    const stringData = objectToString(data);
    return new Promise((reolve, reject) => {
        if (type === 'get') {
            xhr.open(type, url + '?' + stringData);
            xhr.send();
        } else {
            xhr.open(type, url);
            xhr.setReqeustHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(stringData);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    const resp = dataType === 'json' ? JSON.parse(xhr.responseText) : xhr.responseText;
                    resulve(resp);
                } else {
                    reject(xhr.status);
                }
            }
        } 
    });
}
```

