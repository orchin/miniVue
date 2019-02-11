# miniVue.js #

模仿Vuejs的原理开发的简单数据驱动框架；只有数据驱动部分，没有路由；实验之作。

Simple data-driven framework, imitating the principle of Vue.js; only data-driven part, no routing function. Experiments.

Developed by Orchin<793970086@qq.com>

Start from 2018.8

## Features 主要功能 ##
- 单向数据绑定

  文档中{{}}语法，元素上 :value，:src，:href，:class
- 双向数据绑定

  元素上v-model，支持input，textarea，select标签
- 事件绑定

  @事件，例如@click=""，事件支持focus,blur,change,scroll,load,unload,click,dbclick,mouseover,mouseout,mousemove,mousedown,mouseup,keypress,keydown,keyup,touchstart,touchmove,touchend
- 条件

  元素上 v-if/v-else ，v-show 
- 循环

  元素上 v-for

## Get Started 使用方法 ##
- 用法示例
```
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<script src="../miniVue.js"></script>
	</head>
	<body>
		<div id="app">
			<p>Hi All，my name is {{name}} , I'm {{age}} years old. I'm from {{info.city}}</p>
			<p>{{info.intro}}</p>
			<div>
				<button @click="add">SET Age++</button>
			</div>
		</div>
	</body>
<script>
var app=new miniVue({
	el:"#app",
	data:{
		name:"jiaozi",
		age:30,
		info:{
			intro:"Hello World, nice to meet you.",
			city:"GuangZhou",
			gender:"male"
		}
	},
	methods:{
		add(n){
			n=parseInt(n)||1;
			this.age+=n;
		},
	}
});
</script>
</html>
```
   
## Requirements 系统要求 ##
- 浏览器要支持ES5以上。

  Browsers must support ECMAScript 5 or more.

### End