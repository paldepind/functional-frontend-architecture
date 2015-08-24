const tape = require('tape')
    , test = tape.test;

const compose = require('ramda/src/compose');
const curry = require('ramda/src/curry');
const map = require('ramda/src/map');
const all = require('ramda/src/all');
const zip = require('ramda/src/zip');

const Future = require('ramda-fantasy/src/Future');

const upload = require('./upload');
const uploadList = require('./list');
const uploader = require('./uploader');

const noop = function(){}

/******************************************************************************/
const progressUpload = (total, loaded, data) => {
  return upload.update( upload.Action.Progress({total,loaded},noop), data );
}

const finishUpload = upload.update(upload.Action.Uploaded());

test('upload component, single file', (assert) => {
  
  let subject = upload.init([{ name: 'GreatAmericanNovel.pdf',
                               type: 'application/pdf'}
                           ]);
  assert.equal(subject.status, 'initial', 'initial status');
  assert.equal(subject.title, 'GreatAmericanNovel.pdf', 'title');
  
  subject = progressUpload(100, 1, subject);
  assert.equal(subject.status, 'uploading', 
               'uploading status after progress action 1');
  assert.equal(subject.progress.loaded, 1, 'loaded');
  assert.equal(subject.progress.total, 100, 'total');

  subject = progressUpload(100, 65.4321, subject);
  assert.equal(subject.status, 'uploading', 
               'uploading status after progress action 65.4321');
  assert.equal(subject.progress.loaded, 65.4321, 'loaded non-integer');
  assert.equal(subject.progress.total, 100, 'total');

  subject = progressUpload(100, 100, subject);
  assert.equal(subject.status, 'processing', 
               'processing status after progress action 100');
  
  subject = finishUpload(subject);
  assert.equal(subject.status, 'uploaded', 
               'uploaded status after uploaded action');

  assert.end();
});

test('upload component, multiple files', (assert) => {

  let subject = upload.init([
    { name: 'chapter1.txt', type: 'text/plain' },
    { name: 'chapter2.txt', type: 'text/plain' },
    { name: 'chapter3.txt', type: 'text/plain' }
  ]);

  assert.equal(subject.title, '(3 files)', 'title indicates 3 files');

  assert.end();
});


/******************************************************************************/

const dummyUploader = curry( (total, steps, abort, final, files) => {
  return new Future( (rej, res) => {
    
    const progress = (loaded, delay) => {
      delay = delay + ( Math.random() * 2000 );
      setTimeout( 
        () => res(uploader.Result.Progress({total,loaded},abort)),
        delay
      );
      return delay;
    }

    const delay = steps.reduce( (delay,step) => progress(step,delay), 0); 

    if (final){
      setTimeout(
        () => res(final({})),
        delay + ( Math.random() * 2000 )
      );
    }

  });
});


test('upload list component, add file list, progress', (assert) => {
  assert.plan(4 + 4);
  
  let subject = uploadList.init(), tasks, snapshots = [];
  
  const update = (action) => {
    [subject, tasks] = uploadList.update(action, subject);
    map((a) => a.fork((err) => {console.error(err); throw err}, update), tasks);
    snapshots.push(subject);
    console.log(subject);
  }
  
  const steps = [1,3,10,19,100];
  const up = dummyUploader(100, steps, noop, null);

  update( 
    uploadList.Action.Create(up, [
      { name: 'chapter1.txt', type: 'text/plain' },
      { name: 'chapter2.txt', type: 'text/plain' },
      { name: 'chapter3.txt', type: 'text/plain' }
    ])
  );

  assert.equal(subject.length,          1, 'upload list has 1 file list');
  assert.equal(subject[0].files.length, 3, '3 files in group');
  assert.equal(subject[0].title, '(3 files)', 'title indicates 3 files');
  assert.equal(subject[0].status,  'initial', 'initial status');

  setTimeout( () => {
      
      assert.equal(snapshots.length, steps.length + 1,  
                   '1 initial transition + 1 per expected progress step');

      assert.ok( all( (s) => s[0].status == 'uploading', snapshots.slice(1,-1)),
                 'uploading status after each progress step except the last');

      assert.ok( all( (s) => s[0].status == 'processing', snapshots.slice(-1)),
                 'processing status after loaded 100% of total (last step)');

      assert.ok( all( ([step,s]) => s[0].progress.loaded === step, 
                      zip(steps, snapshots.slice(1))),
                 'expected loading progress at each progress step'); 
    },
    (steps.length)*2000  // max time for steps to complete
  );
   
});

test('upload list component, add two file lists, progress independently', (assert) => {
  assert.plan(1);
  
  let subject = uploadList.init(), tasks, snapshots = [];
  
  const update = (action) => {
    [subject, tasks] = uploadList.update(action, subject);
    map((a) => a.fork((err) => {console.error(err); throw err}, update), tasks);
    snapshots.push(subject);
    console.log(subject);
  }
  
  const trigger = (up, files, delay) => {
    setTimeout( () => {
        update(
          uploadList.Action.Create(up, files)
        );
      },
      delay
    );
  }

  const steps1 = [1, 23,34,45,56,67,78,99,100];
  const steps2 = [22,34,46,59,78,100];

  const up1 = dummyUploader(100, steps1, noop, uploader.Result.OK);
  const up2 = dummyUploader(100, steps2, noop, uploader.Result.OK);

  trigger( up1, 
           [ {name: 'first.png', type: 'image/png'} ], 
           Math.random() * 2000 );

  trigger( up2, 
           [ {name: 'second.png', type: 'image/png'} ], 
           Math.random() * 2000 );

  setTimeout( () => {
      const exp = 2 + steps1.length + steps2.length + 2;
      assert.equal(snapshots.length, exp,  
                   '' + exp + ' == ' + 
                   '1 initial transition per file list + ' + 
                   '1 per expected progress step + ' + 
                   '1 final transition per file list');

   },
    (4 + Math.max(steps1.length,steps2.length)) * 2000  // max time for steps to complete
  );
   
});

test('upload list component, add file list, result ok', (assert) => {
  assert.plan(2);
  
  let subject = uploadList.init(), tasks, snapshots = [];
  
  const update = (action) => {
    [subject, tasks] = uploadList.update(action, subject);
    map((a) => a.fork((err) => {console.error(err); throw err}, update), tasks);
    snapshots.push(subject);
    console.log(subject);
  }
  
  const steps = [];
  const up = dummyUploader(100, steps, noop, uploader.Result.OK);

  update( 
    uploadList.Action.Create(up, [
      { name: 'chapter1.txt', type: 'text/plain' },
      { name: 'chapter2.txt', type: 'text/plain' },
      { name: 'chapter3.txt', type: 'text/plain' }
    ])
  );

  setTimeout( () => {
      
      assert.equal(snapshots.length, 1 + 1,  
                   '1 initial transition + 1 for result');

      assert.equal(snapshots[1][0].status, 'uploaded', 
                   'status uploaded after result OK');

    },
    2000 
  );
   
});

test('upload list component, add file list, result error', (assert) => {
  assert.plan(2);
  
  let subject = uploadList.init(), tasks, snapshots = [];
  
  const update = (action) => {
    [subject, tasks] = uploadList.update(action, subject);
    map((a) => a.fork((err) => {console.error(err); throw err}, update), tasks);
    snapshots.push(subject);
    console.log(subject);
  }
  
  const steps = [];
  const up = dummyUploader(100, steps, noop, uploader.Result.Error);

  update( 
    uploadList.Action.Create(up, [
      { name: 'chapter1.txt', type: 'text/plain' },
      { name: 'chapter2.txt', type: 'text/plain' },
      { name: 'chapter3.txt', type: 'text/plain' }
    ])
  );

  setTimeout( () => {
      
      assert.equal(snapshots.length, 1 + 1,  
                   '1 initial transition + 1 for result');

      assert.equal(snapshots[1][0].status, 'error', 
                   'status uploaded after result error');

    },
    2000 
  );
   
});




