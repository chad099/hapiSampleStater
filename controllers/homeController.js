'use strict'

const prefix = '/';

module.exports= [
  {
    method:'GET',
    path  : `${prefix}`,
    handler:(request, reply)=>{
    console.log("i am here");
    reply("i am here");
    }
  },
];
