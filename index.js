const datasGetter = require('./datas');
/*
1. Подключается к базе данных
2. Запускается веб сервер с имеющейся базой данных, если она не пуста
3. Идёт проверка даты обновления из базы данных (пока по файлу данных)
4. Если необходимо обновление (прошлое обновление было не сегодня) то:
    1. Загружается файл сиситем
    2. Файл парсится и перебирается итерационно
        1. Для каждой системы создаётся запись в БД с параметром "не обработанна"
    3. Для каждой системы в БД, если она "не обработанна" строится массив зависимостей длякаждой друго системы и пишется файл, параметр "не обработанна" удаляется
5. Всё работает
*/
/*function distance(initial, target){
  const {x: initialX, y: initialY, z: initialZ} = initial;
  const {x: targetX, y: targetY, z: targetZ} = target;
  return Math.sqrt(Math.pow((initialX - targetX), 2) + Math.pow((initialY - targetY), 2 ) + Math.pow((initialZ - targetZ), 2))
}*/
datasGetter.initDb()
    //.then(() => datasGetter.db.dropDatabase())
    .then(() => datasGetter.count())
    .then(count => new Promise(function(resolve) {
        datasGetter.actualDB(count === 0)
            .then(resolve);
    }))
    //.then(()=>{}) //Обойти базу данных и дописать списки путей там, где их нет
    .then(datasGetter.closeDB)
    .catch(err=>{throw err;});
  
  
  /*for(let index in systems){
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

//TODO: подключить линтер