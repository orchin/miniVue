/* 
* miniVue.js - v1.1.0
* Developed by Orchin<793970086@qq.com>
* start from 2018.10
* 模仿Vuejs的原理开发的简单数据驱动框架； 
*/
class miniVue{
	constructor({el, data, methods}){
        this.$data = data;
        this.$el = document.querySelector(el);
        this.$methods = methods;
		this.$mv = {};
		this.$textNodes =[];
		this.$loopNodes =[];
		this.$hasNewNodes = true;
		this.initListener();
		this.initUpdater();
		this.initObserver();
    }
	//对象判断
	isObject(obj){
		return obj != null && typeof(obj) == 'object';
	}
	//根据key获取data数据
	getDataByKey(key){
		if(!key) return;
		key=key.replace(/\s+/g,"");
		var keys=key.split(".");
		var data=this.$data;
		for(var i in keys){
			data=data[keys[i]];
			if(data==undefined || data==null) break;
		};
		return data;
	}
	//根据key设置data数据
	setDataByKey(key,value){
		if(!key) return false;
		key=key.replace(/\s+/g,"");
		var keys=key.split("."),
			parentData=this.$data,
			endId=0;
		for(var i=0;i<keys.length-1;i++){
			parentData=parentData[keys[i]];
			endId++;
			if(parentData==undefined || parentData==null) break;
		};
		if(!parentData) return false;
		parentData[keys[endId]]=value;
		return true;
	}
	//获取选择器dom及指定属性
	getAttrDoms(selector,attribute,callback){
		var doms=this.$el.querySelectorAll(selector);
		doms.forEach((d,i)=>{
			if(d.nodeType==1 && d.hasAttribute(attribute)){
				var key=d.getAttribute(attribute);
				if(key) callback(d,key);
			}
		})
	}
	//获取下一个元素节点，代替 nextElementSibling
	nextElementSiblings(node){
		if(node.nextSibling){
			if(node.nextSibling.nodeType==1) return node.nextSibling;
			return this.nextElementSiblings(node.nextSibling);
		};
		return null;
	}
	//初始化observer观察器
	initObserver(){
		this.observer(this.$data);
	}
	//观察器，解析数据
	observer(data,parentKey=""){
		if(!this.isObject(data)) return;
		//parentKey=parentKey||"";
		for(var key in data){
			this.defineReactive(key,data[key],data,parentKey);
		}
	}
	//数据转化为存取器属性
	defineReactive(key,value,data,parentKey){
		var that=this;
		var curKey=parentKey?parentKey+'.'+key:key;
		Object.defineProperty(data,key,{
			enumerable:true,
			configurable:true,
			get:function(){
				return value;
			},
			set:function(newVal){
				if (value!==newVal) {
					value=newVal;
					//数据变化时调用更新
					that.updater(curKey);
					//数据变化成对象时，把对象也转化为存取器
					if(that.isObject(newVal)) that.observer(newVal,curKey);
				}
			}
		});
		that.observer(value,curKey);
	}
	//初始化updater更新器
	initUpdater(){
		//首次渲染更新
		this.updater();
	}
	//更新器，负责渲染更新的数据到视图
	updater(fullKey){
		console.log("set:",fullKey,"   data:",this.$data);
		this.update_loop(fullKey);
		this.update_text(fullKey);
		this.update_bind(fullKey);
		this.update_model(fullKey);
		this.update_select(fullKey);
		this.update_condition(fullKey);
		this.$hasNewNodes=false;
	}	
	//更新 绑定属性元素 :value,:src,:href,:class
	update_bind(fullKey){
		var attrs=["value","src","href","class"],
			selectors=[];
			attrs.forEach((v,i) =>{
				selectors[i]=(fullKey&&!this.$hasNewNodes)?"*[\\:"+v+"='"+fullKey+"']":"*[\\:"+v+"]";
			});
		selectors.forEach((st,i)=>{
			this.getAttrDoms(st,':'+attrs[i],(dom,key)=>{
				if(attrs[i]=="class"){
					if(dom.temp_class) dom.classList.remove(dom.temp_class);
					dom.temp_class=this.getDataByKey(key);dom.classList.add(dom.temp_class);
				}else dom[attrs[i]]=this.getDataByKey(key);
			});
		});
	}
	//更新 v-model双向绑定 input，textarea
	update_model(fullKey){
		var selector=(fullKey&&!this.$hasNewNodes)?"input[v-model='"+fullKey+"'],textarea[v-model='"+fullKey+"']":"input[v-model],textarea[v-model]";
		this.getAttrDoms(selector,'v-model',(dom,key)=>{
			dom.value=this.getDataByKey(key);
		});
	}
	//更新 select 标签
	update_select(fullKey){
		var selector=(fullKey&&!this.$hasNewNodes)?"select[v-model='"+fullKey+"'],select[\\:value='"+fullKey+"']":"select[v-model],select[\\:value]";
		var setOption=(dom,key)=>{
			var sdata=this.getDataByKey(key);
			dom.querySelectorAll('option').forEach(op => {
				if(op.value==sdata) op.setAttribute('selected', true);
				else op.removeAttribute('selected');
			});
		};
		this.getAttrDoms(selector,'v-model',setOption);
		this.getAttrDoms(selector,':value',setOption);
	}
	//获取待操作的文本节点列表
	matchTextNodes(nodes){
		var reg = /{{ *([\w_\-\.\[\]]+) *}}/g;
		var nodeList=[];
		nodes.forEach(node=>{
			if(node.nodeType==3 && node.nodeValue.match(reg)){
				nodeList.push({node:node,value:node.nodeValue});
			}else if(node.nodeType && node.childNodes.length>0){
				nodeList=nodeList.concat(this.matchTextNodes(node.childNodes));
			}
		});
		return nodeList;
	}
	//更新文本
	update_text(fullKey){
		if(!fullKey){
			//获取待操作的文本节点列表
			this.$textNodes=this.matchTextNodes(this.$el.childNodes);
		}else{
			var newNodes=this.matchTextNodes(this.$el.childNodes);
			this.$textNodes=this.$textNodes.concat(newNodes);
		};
		var reg=/{{ *([\w_\-\.\[\]]+) *}}/g;
		for(var i in this.$textNodes){
			var vNode=this.$textNodes[i];
			var content=vNode.value;
			if(fullKey && !this.$hasNewNodes && !content.match(new RegExp('{{ *(['+fullKey+']+) *}}','g'))) continue;
			var list=content.match(reg);
			for(var k in list){
				var key=list[k].slice(2,-2);
				content=content.replace(list[k],this.getDataByKey(key));
			};
			vNode.node.nodeValue=content;
		}
	}
	//解析条件
	analysisExpression(expression){
		var reg=/\b(?<![\"\'])([a-zA-Z][a-zA-Z0-9\.\_]+)/g;
		var newexp=expression.replace(reg,"this.$data.$1");
		var regArr=/\.(\d)\./g;
		newexp=newexp.replace(regArr,"[$1].");
		return eval(newexp);
	}
	//切换隐藏/显示元素
	showHideElement(dom,show){
		if(show){
			if(dom.style.display=="none") dom.style.display=dom.temp_display||"";
		}else{
			if(dom.style.display!="none") dom.temp_display=dom.style.display;
			dom.style.display="none";
		}
	}
	//更新 条件 标签
	update_condition(){
		this.getAttrDoms('*','v-show',(dom,key)=>{
			if(this.analysisExpression(key)) this.showHideElement(dom,true);
			else this.showHideElement(dom,false);
		});
		this.getAttrDoms('*','v-if',(dom,key)=>{
			var nextDom=this.nextElementSiblings(dom);
			if(this.analysisExpression(key)){
				this.showHideElement(dom,true);
				if(nextDom && nextDom.hasAttribute('v-else')){
					this.showHideElement(nextDom,false);
				}
			}else{
				this.showHideElement(dom,false);
				if(nextDom && nextDom.hasAttribute('v-else')){
					this.showHideElement(nextDom,true);
				}
			}
		});
	}
	//分析循环数据
	analysisLoopItem(expression){
		var arr=expression.split("in");
		return {item:arr[0].replace(/\s+/g,""),key:arr[1].replace(/\s+/g,"")}
	}
	//更新 循环
	update_loop(fullKey){
		if(!fullKey){
			this.getAttrDoms('*','v-for',(dom,key)=>{
				var parent=dom.parentNode;
				var nodeId=Math.floor(Math.random()*100000);
				var pointNode=document.createComment(nodeId);
				parent.replaceChild(pointNode,dom);
				var loopParam=this.analysisLoopItem(key);
				this.$loopNodes.push({node:dom,exp:key,point:pointNode,itemKey:loopParam.item,dataKey:loopParam.key,data:this.getDataByKey(loopParam.key),children:[]});
			});
		};
		this.$loopNodes.forEach((n,i) =>{
			if(fullKey && n.dataKey!=fullKey) return;
			n.data=this.getDataByKey(n.dataKey);
			this.$hasNewNodes = true;
			var idx=0;
			var reg=new RegExp('\\b'+n.itemKey+'\\b','g');
			var ln=n.node.cloneNode(true);
			ln.removeAttribute("v-for");
			for(var i in n.children){
				var sibling=n.children[i];
				sibling.parentNode.removeChild(sibling);
			};
			n.children.length=0;
			for(var i in n.data){
				let divTemp = document.createElement("div");
				divTemp.innerHTML=ln.outerHTML.replace(reg,n.dataKey+'.'+idx+'');
				divTemp.firstChild.temp_loop_id=n.point.nodeValue;
				n.children.push(divTemp.firstChild);
				n.point.parentNode.insertBefore(divTemp.firstChild,n.point);
				idx++;
			};
			this.initListener();
		});
	}
	
	//监听器，监听事件及输入绑定
	initListener(){
		this.listener_mouse();
		this.listener_model();
	}
	//监听记录，防止重复添加
	checkListener(dom,event){
		if(dom.temp_listeners && dom.temp_listeners.indexOf(event)>=0) return true;
		if(!dom.temp_listeners) dom.temp_listeners=[];
		dom.temp_listeners.push(event);
		return false;
	}
	//参数分解
	analysisArgs(key){
		if(key.indexOf("(")<0) return [];
		var argStr=key.slice(key.indexOf("(")+1,key.lastIndexOf(")"));
		var args=argStr.split(",");
		return args;
	}
	//监听@事件
	listener_mouse(){
		var events=["focus","blur","change","scroll","load","unload","click","dbclick","mouseover","mouseout","mousemove","mousedown","mouseup","keypress","keydown","keyup","touchstart","touchmove","touchend"],
			selectors=[];
		events.forEach((v,i) =>{
			selectors[i]="*[\\@"+v+"]";
		});
		this.$mv=this.$data;
		Object.assign(this.$mv,this.$methods);
		selectors.forEach((st,i)=>{
			this.getAttrDoms(st,'@'+events[i],(dom,key)=>{
				if(this.checkListener(dom,events[i])) return;
				dom.addEventListener(events[i], ()=>{
					//this.$methods[key].bind(this.$mv)();
					var fn=key.split("(")[0];
					var args=this.analysisArgs(key);
					args.forEach((v,aid)=>{
						args[aid]=this.analysisExpression(v);
					})
					this.$methods[fn].apply(this.$mv,args)
				});
			});
		});
	}
	//监听 输入事件
	listener_model(){
		var selector="*";
		this.getAttrDoms('input, textarea','v-model',(dom,key)=>{
			if(this.checkListener(dom,'input')) return;
			dom.addEventListener('input', ()=>{
				var res=this.setDataByKey(key,dom.value);
			});
		});
		this.getAttrDoms('select','v-model',(dom,key)=>{
			if(this.checkListener(dom,'change')) return;
			dom.addEventListener('change', ()=>{
				var res=this.setDataByKey(key,dom.options[dom.options.selectedIndex].value);
			});
		});
	}
	
};