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

const resolvePromise = (promise2, x, resolve, reject) => {
    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle dected for promise #<Promise>'));
    }
    
    let called = false;
    if ((typeof x === 'object' && x != null) || typeof x === 'function') {
        try {
            const then = x.then;
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) {
                        return;
                    }
                    called = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, e => {
                    if (called) {
                        return;
                    }
                    called = true;
                    reject(e);
                });
            } else {
                resolve(x);
            }
        } catch (e) {
            if (called) {
                return;
            }
            called = true;
            reject(e);
        }
    } else {
        resolve(x);
    }
};

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
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
        onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e; };
        
        const promise2 = new Promise((resolve, reject) => {
            if (this.status === FULFILLED) {
                setTimeout(() => {
                    try {
                        const x = onFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            }
            
            if (this.status === REJECTED) {
                setTimeout(() => {
                    try {
                        const x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            }
            
            if (this.status === PENDING) {
                this.onResolvedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            const x = onFulfilled(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                });
                
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            const x = onRejected(this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                });
            }
        });
        
        return promise2;
    }
    
    static resolve(value) {
        if (value instanceof Promise) {
            return value;
        }
        return new Promise((resolve, reject) => {
            resolve(value);
        });
    }
    
    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason);
        });
    }
    
    static all(values) {
        if (!Array.isArray(values)) {
            const type = typeof values;
            return new TypeError(`TypeError: ${type} ${values} is not iterable`);
        }
        
        return new Promise((resolve, reject) => {
            const resultArr = [];
            let idx = 0;
            
            const processResultByKey = (value, index) => {
                resultArr[index] = value;
                if (++idx === values.length) {
                    resolve(resultArr);
                }
            };
            
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (value && typeof value.then === 'function') {
                    value.then((val) => {
                        processResultByKey(val, i);
                    }, reject);
                } else {
                    processResultByKey(value, i);
                }
            }
        });
    }
    
    static race(promises) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < promises.length; i++) {
                const p = promises[i];
                if (p && typeof p.then === 'function') {
                    p.then(resolve, reject);
                } else {
                    resolve(p);
                }
            }
        });
    }
    
    catch(fn) {
        return this.then(null, fn);
    }
    
    finally(fn) {
        return this.then((value) => {
            return Promise.resolve(fn()).then(() => value);
        }, (e) => {
            return Promise.resolve(fn()).then(() => { throw e });
        });
    }
}
```



```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Promise.prototype.resolve');
  }, 1000);
}).then((data) => {
      console.log('success:', data);
    }, (e) => {
      console.log('failed:', e);
    });

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('Promise.prototype.reject');
  }, 1000);
}).then((data) => {
      console.log('success:', data);
    }, (err) => {
      console.log('failed:', err);
    });

Promise.resolve(new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('Promise.resolve');
    }, 3000);
})).then((data) => {
    console.log('success:', data);
}).catch((e) => {
    console.log('error:', e);
});

Promise.resolve('Promise.finally first Promise').finally(() => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Promise.finally second Promise');
        }, 1000);
    });
}).then((data) => {
    console.log('success:', data);
}).catch((e) => {
    console.log('error:', e);
});

const p3 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('Promise.all resolve');
    }, 1000);
});

const p4 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('Promise.all reject');
    }, 1000);
});

Promise.all([1, 2, p3]).then((data) => {
    console.log('resolve:', data);
}, (e) => {
    console.log('reject:', e);
});

Promise.all([1, 2, p3, p4]).then((data) => {
    console.log('resolve:', data);
}, (e) => {
    console.log('reject:', e);
});
```



* 数组扁平化
* 函数柯里化
* 数组去重

