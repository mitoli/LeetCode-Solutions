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



```javascript
const data = {
  age: 18,
  name: 'Leo',
  education: ['小学', '初中', '高中', '大学', undefined, null],
  likesFood: new Set(['fish', 'banana']),
  friends: [
    { name: 'Marry', sex: 'woman' },
    { name: 'Tina', sex: 'woman' },
    { name: 'Jerry', sex: 'man' }],
  work: {
    time: '2019',
    project: { name: 'test', obtain: ['css', 'html', 'js'] }
  },
  play: function () {
    console.log('玩滑板');
  }
};

deepClone(data);

const data2 = {
  name: 'foo',
  child: null,
};
data2.child = data2;

deepClone(data2);
```



* 手写Promise



```javascript
const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onResolvedCallbacks = [];
        this.onRejectedCallbacks = [];
        
        const resolve = (value) => {
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                this.onResolvedCallbacks.forEach(fn => fn());
            }
        };
        
        const reject = (reason) => {
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn => fn());
            }
        };
        
        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }
    
    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw new Error(reason) };
        const self = this;
        return new Promise((resolve, reject) => {
            if (self.status === FULFILLED) {
                try {
                    const result = onFulfilled(self.value);
                    result instanceof Promise ? result.then(resolve, reject) : resolve(result);
                } catch(e) {
                    reject(e);
                }
            }
            
            if (self.status === REJECTED) {
                try {
                    const result = onRejected(self.reason);
                    result instanceof Promise ? result.then(resolve, reject) : resolve(result);
                } catch(e) {
                    reject(e);
                }
            }
            
            if (self.status === PENDING) {
                self.onFulfilledCallbacks.push(() => {
                    try {
                        const result = onFulfilled(self.value);
                        result instanceof Promise ? result.then(resolve, reject) : resolve(result);
                    } catch(e) {
                        reject(e);
                    }
                });
                self.onRejectedCallbacks.push(() => {
                    try {
                        const result = onRejected(self.reason);
                        result instanceof Promise ? result.then(resolve, reject) : resolve(result);
                    } catch(e) {
                        reject(e);
                    }
                });
            }
        });
    }
    
    catch(onRejected) {
        return this.then(null, onRejected);
    }
    
    static resolve(value) {
        if (value instanceof Promise) {
            return value;
        } else {
            return new Promise((resolve, reject) => {
                resolve(value);
            });
        }
    }
    
    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason);
        });
    }
    
    static all(arr) {
        const n = arr.length;
        const values = new Array(n);
        let count = 0;
        return new Promise((resolve, reject) => {
            for (let i = 0; i < n; i++) {
                Promise.resolve(arr[i]).then((val) => {
                    values[i] = val;
                    count++;
                    if (count === n) {
                        resolve(values);
                    }
                }, (err) => {
                    reject(err);
                });
            }
        });
    }
    
    static race(arr) {
        return new Promise((resolve, reject) => {
            arr.forEach((p) => {
                Promise.resolve(p).then(val => resolve(val), err => reject(err));
            });
        });
    }
}
```



```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功');
  }, 1000);
})
  .then(
    (data) => {
      console.log('success', data);
    },
    (err) => {
      console.log('failed', err);
    }
  );

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('失败');
  }, 1000);
})
  .then(
    (data) => {
      console.log('success', data);
    },
    (err) => {
      console.log('failed', err);
    }
  );
```



* 数组扁平化
* 函数柯里化
* 数组去重

