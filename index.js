const mongoInterface = require('./mongo_interface');
const schedule = require('node-schedule');
/*
1. Подключается к базе данных
2. Запускается веб сервер с имеющейся базой данных, если она не пуста
3. Идёт проверка даты обновления из базы данных (пока по файлу данных)
4. Если необходимо обновление (прошлое обновление было не сегодня) то:
  1. Загружается файл сиситем
  2. Файл парсится и перебирается итерационно
  3. Для каждой системы в БД высчитываются расстояния до всех систем, до кторых расстояний нет
5. Всё работает

function distance(initial, target){
  const {x: initialX, y: initialY, z: initialZ} = initial;
  const {x: targetX, y: targetY, z: targetZ} = target;
  return Math.sqrt(Math.pow((initialX - targetX), 2) + Math.pow((initialY - targetY), 2 ) + Math.pow((initialZ - targetZ), 2))
}*/

let updaeterErrorDeep = 0;

function reActualData() {
  console.log('reActualData');
  return mongoInterface.initDb()
   // .then(() => mongoInterface.db.dropDatabase())
    .then(() => mongoInterface.System.count({}))
    .then((count) => {
      console.log(`Count of systems is ${count}`);
      return count;
    })
    .then(count => mongoInterface.actualDB(count === 0))
   // .then(()=>{}) //Обойти базу данных и дописать списки путей там, где их нет
   // .then(mongoInterface.closeDB)
    .then(() => { updaeterErrorDeep = 0; })
    .catch((err) => {
      if (updaeterErrorDeep < 10) {
        updaeterErrorDeep++;
        setTimeout(reActualData, updaeterErrorDeep * 12000);
      } else {
        throw err;
      }
    });
}

schedule.scheduleJob('0 0 * * *', reActualData);

reActualData();


  /*
  for(let index in systems){
  if(systems.hasOwnProperty(index)){
  let system = systems[index];
  console.log(index)
  /*
  if(systems.hasOwnProperty(index)){
  let system = systems[index];
  system.distances = [];
  for(let targetIndex in systems){
    if(systems.hasOwnProperty(targetIndex)){
    let target = systems[index];
    if(target.distances && target.distances[index]){
      system.distances[targetIndex] = target.distances[index];
    }
    system.distances[targetIndex] = distance(system, target);
    }
  }
  }*//*
  }
}*/
