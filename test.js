const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('�ɹ�');
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
    reject('ʧ��');
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

