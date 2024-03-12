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
                    resolve(resp);
                } else {
                    reject(xhr.status);
                }
            }
        } 
    });
}
```



* 对象深拷贝



```javascript
function deepClone(obj, hash = new WeakMap()) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (hash.has(obj)) {
        return hash.get(obj);
    }
    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (obj instanceof RegExp) {
        return new RegExp(obj);
    }
    const newObj = {};
    hash.set(obj, newObj);
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value !== 'object' || value === null) {
            newObj[key] = value;
        } else if (Array.isArray(value)) {
            newObj[key] = [];
            for (const item of value) {
                newObj[key].push(deepClone(item, hash));
            }
        } else if (value instanceof Set) {
            newObj[key] = new Set();
            for (const item of value) {
                newObj[key].add(deepClone(item, hash));
            }
        } else if (value instanceof Map) {
            newObj[key] = new Map();
            for (const [k, v] of value) {
                newObj[key].set(k, deepClone(v, hash));
            }
        } else {
            newObj[key] = deepClone(value, hash);
        }
    }
    return newObj;
}
```





