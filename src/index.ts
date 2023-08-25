import cron from 'node-cron';

function task1() {
    // Your first function logic here
    console.log('task1');
}

function task2() {
    // Your second function logic here
    console.log('task2');
}

function task3() {
    // Your third function logic here
    console.log('task3');
}

// Schedule tasks to run exactly every minute
cron.schedule('0 * * * * *', () => {
    task1();
    task2();
    task3();
});