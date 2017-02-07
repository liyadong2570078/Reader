//  --------------------工具类---------------------------------
			(function(){
			    var Util = (function(){
			        var prefix = "html5_reader_";
			        var storageGetter = function(key){
			            return localStorage.getItem(prefix + key);
			        }
			        var storageSetter = function(key, val){
			            return localStorage.setItem(prefix + key , val);
			        }
			        //获得数据并解码
			        var getJSONP = function(url,callback){
			            return $.jsonp({
			                url: url,
			                cache: true,
			                callback:'duokan_fiction_chapter',//callback(data)
			                success:function(result){
			                    //数据解码
			                    //debugger;
			                    var data = $.base64.decode(result);//解析后台php base64.encode(data)的数据
			                    var json = decodeURIComponent(escape(data));//解码--编码的数据escape();解析出来英文
			                    callback(json);//真回调，非上述的callback
			                }
			            });
			        }
			        return{
			            storageGetter: storageGetter,
			            storageSetter: storageSetter,
			            getJSONP:getJSONP
			        }
			    })();
			
		
		
		//  ---------------------初始化操作------------------------------------	
			//缓存一些操作的DOM
			var Dom = {
			   top_nav: $('#top-nav'), 
			   nav_panel: $('.nav_panel'),
			   bottom_nav:$('.bottom-nav'),
			   font_buttom:$('#font_buttom'),
			   fiction_container:$('#fiction_container'),
			   bg_panel:$('#bg-panel'),
			   day_mode:$('.day-mode'),
			   night_mode:$('.night-mode'),
			   pre_button:$('#pre_button'),
			   next_button:$('#next_button')
			}
			
			var win = $(window);
			var doc = $(document);
			var defauleSize = 14,
			    defaultColor = '#F3E3CC',
			    defaultMode = 'day',
			    nightColor = '#080C10',
			    maxFontSize = 20,
			    minFontSize = 12;
			    
			var reader_UI, reader_model;//这里全局，也可以传参，匿名函数，不怕
			    
			var font_size = parseInt(Util.storageGetter('font_size')) || defauleSize;
			var bg_color = Util.storageGetter('bg_color') || defaultColor;
			var mode = Util.storageGetter('mode') || defaultMode;
			
            
            //设置初始化字体为用户保存的字体大小
            Dom.fiction_container.css('font_size', font_size);
            
            if(mode == 'night'){
               Dom.fiction_container.css('background', nightColor); 
               Dom.day_mode.show();
               Dom.night_mode.hide();
            }else{
                Dom.fiction_container.css('background', bg_color);

            }
            
    //  --------------------项目主入口-------------------------        
            
            //整个项目的入口函数
            function main(){
                reader_UI = readerView(Dom.fiction_container);//传入一个参数，dom容器；输出一个函数解析数据，传入参数data即可
                reader_model = readerModel(); //实例化一个model
                reader_model.init(function(data){
                    reader_UI(data);          //解析数据data
                });
                
                eventHandler();    //处理事件
            }
            
           
    //  ------------------项目的Model------------------------------------------------ 
    
			//用promise去处理多层的异步调用；===》多层回调？避免的多层回调 promise，generate；
            //项目的M，实现阅读相关的数据交互方法
            function readerModel(){
                var chapterID;
                var chapterNum;
                
                //获得章节信息
                var getFictionInfo = function(callback){
                    $.get('./data/chapter.json',function(data){
                        //TODO 获得章节信息之后的回调
                        chapterID = data.chapters[1].chapter_id;
                        chapterNum = data.chapters.length;
                        callback && callback();
                    },'json');
                }
				
				//使用promise去除回调函数
				var getFictionInfoPromise = function(){
					return  new Promise(function(resovle,reject){
						$.get('./data/chapter.json',function(data){
							//TODO 获得章节信息之后的回调
							if(data.result == '0'){
								chapterID = data.chapters[1].chapter_id;
								chapterNum = data.chapters.length;
								resovle(data);
							}else{
								reject();
							}
						},'json');
					
					})
				}
                
                //获得章节内容
                var getChapterContent = function(chapter_id, callback ){
                    //获得章节内容后的回调，data1,2,3,4.json
                    $.get('data/data' + chapter_id + '.json',function(data){
                        if(data.result == '0'){
                            var url = data.jsonp;//得到jsonp的url地址==可以看jsonp地址里的数据,这里涉及到了跨域请求。
                            
                            //调用封装好函数，跨域请求，并对数据base64解码
                            Util.getJSONP(url, function(data){
                                //debugger;
                                callback && callback(data);
                            });
                        }
                    },'json');
                };
				
				//进一步promise优化
				
				var getChapterContentPromise = function(){
					return new Promise(function(resolve,reject){
						$.get('data/data' + chapterID + '.json',function(data){
							if(data.result == '0'){
								var url = data.jsonp;//得到jsonp的url地址==可以看jsonp地址里的数据,这里涉及到了跨域请求。
								
								//调用封装好函数，跨域请求，并对数据base64解码
								Util.getJSONP(url, function(data){
									resolve(data);
								});
							}else{
								reject();
							}
						},'json');
					});
				}
                
                var init = function(UIcallback){
                    //getFictionInfo(function(){
                        //getChapterContent(chapterID,function(data){
                            //todo....
                          //  UIcallback && UIcallback(data);
                        //});
                    //});
					
					//单次回调，感觉不出来优势呀！
					//getFictionInfoPromise().then(function(data){
						//getChapterContent(chapterID,function(data){
                         // UIcallback && UIcallback(data);
						//})	
					//})
					
					//多次回调
					getFictionInfoPromise().then(function(data){
						return getChapterContentPromise();
						}).then(function(data){
							UIcallback && UIcallback(data);
						})	
				}
				
				//var init = function(){
				//
				//}
                
                //上一章翻页
                var preChapter = function(UIcallback){
                    chapterID = parseInt(chapterID,10);
                    if(chapterID == 1){
                        alert('已经是第一章了')
                        return;
                    }
                    chapterID --;
                    getChapterContent(chapterID, UIcallback);
                    $('body').scrollTop(0);
                }
                
                 //下一章翻页
                var nextChapter = function(UIcallback){
                    chapterID = parseInt(chapterID,10);
                    // if(chapterID == chapterNum-1){
                    if(chapterID == 4){
                        console.log('已经是I后一章了')
                        return;
                    }
                    chapterID ++;
                    getChapterContent(chapterID, UIcallback);
                    $('body').scrollTop(0);
                    
                }
                
                //返回项目M模块的接口
                return {
                    init:init,
                    preChapter:preChapter,
                    nextChapter:nextChapter
                }
            }
            
           
 //  ----------------------项目的View----------------------------------            
           
            
            //项目的V，实现阅读UI界面
            function readerView(container){
                function parseChapterData(jsonData){
                    var jsonObj = JSON.parse(jsonData);
                    var html = '<h4>' + jsonObj.t +'</h4>';
                    for(var i =0, len = jsonObj.p.length; i < len; i++){
                        html += '<p>' + jsonObj.p[i] + '</p>'
                    }
                    return html;
                }
                return function(data){
                    container.html(parseChapterData(data));
                }
            }
            
            
            
            
 //  ----------------------项目的Controller-----------------------------------
 
            //项目的C，实现与阅读相关的事件处理
            function eventHandler(){
                //4.0 click 300ms延时, zepto tap touch  
                $('#action-mid').click(function(){
                    if(Dom.top_nav.css('display') == 'none'){
                        //debugger;
                        Dom.top_nav.show();
                        Dom.bottom_nav.show();
                        
                    }else{
                        //debugger;
                        Dom.top_nav.hide();
                        Dom.bottom_nav.hide();
                        Dom.nav_panel.hide();
                        Dom.font_buttom.removeClass('icon-font2');
                    }
                });
                
                win.scroll(function(){
                    Dom.top_nav.hide();
                    Dom.bottom_nav.hide();
                    Dom.nav_panel.hide();
                    Dom.font_buttom.removeClass('icon-font2');
                });
                
               //唤起字体面板
               Dom.font_buttom.click(function(){
                   if(Dom.nav_panel.css('display') == 'none'){
                       Dom.nav_panel.show();
                       Dom.font_buttom.addClass('icon-font2');
                   }else{
                       Dom.nav_panel.hide();
                       Dom.font_buttom.removeClass('icon-font2');
                   }
                   Dom.nav_panel
               });
               
               //返回键清除黑色面板
               $('.icon-back').click(function() {
                   console.log(11);
                   Dom.top_nav.hide();
                        Dom.bottom_nav.hide();
                        Dom.nav_panel.hide();
                  
               });
               //设置字体大小
               $('#large_font').click(function(){
                   if(font_size >= maxFontSize){
                       return;
                   }
                   font_size += 1;
                   Dom.fiction_container.css('font-size', font_size);
                   Util.storageSetter('font_size', font_size);
               });
               $('#small_font').click(function(){
                   if(font_size <= minFontSize){
                       return;
                   }
                   font_size -= 1;
                   Dom.fiction_container.css('font-size', font_size);
                   Util.storageSetter('font_size', font_size);
               });
               
                //事件代理的方式改变背景颜色
                Dom.bg_panel.click(function(event){
                    var target = event.target;
                    var bg_color = $(target).css('background');
                    Dom.fiction_container.css('background', bg_color);
                    Util.storageSetter('bg_color', bg_color);
                    if(target.id == 'circle5'){
                        Dom.day_mode.show();
                        Dom.night_mode.hide();
                    }else{
                        Dom.night_mode.show();
                        Dom.day_mode.hide();
                    }
                })


                Dom.bg_panel.on('click','.bg-circle-out',abc);
                
                function abc(){
                    
                    $(this).children().addClass("bg-circle-current");
            
           $(this).siblings().children().removeClass("bg-circle-current");
                }
                //白天，黑夜模式切换
                Dom.day_mode.click(function(){
                    Dom.night_mode.show();
                    Dom.day_mode.hide();
                     // $('.bg-circle-out').trigger('click');
                     $('#first-bg').children().addClass("bg-circle-current");
            
           $('#first-bg').siblings().children().removeClass("bg-circle-current");
                       console.log('白天');
                    Dom.fiction_container.css('background', defaultColor);
                    Util.storageSetter('mode_color', defaultColor);
                    Util.storageSetter('mode', 'day');
                });
                Dom.night_mode.click(function(){
                    Dom.day_mode.show();
                    Dom.night_mode.hide();
                    console.log('晚上');
                    // $('#circle2').addClass('bg-circle-current');
                     //$('.bg-circle-out').trigger('click');
                     $('#last-bg').children().addClass("bg-circle-current");
            
           $('#last-bg').siblings().children().removeClass("bg-circle-current");
                    Dom.fiction_container.css('background', nightColor);
                    Util.storageSetter('mode_color', nightColor);
                    Util.storageSetter('mode', 'night');
                });
                
                //上下翻页绑定
                Dom.pre_button.click(function(){
                    //ToDo...获得章节翻页的数据-->把数据渲染出来
                    reader_model.preChapter(function(data){
                        reader_UI(data);
                    });
                    
                });
                Dom.next_button.click(function(){
                    reader_model.nextChapter(function(data){
                        reader_UI(data);
                    });
                });
                
                
            }
            
            
            main();
            
		})();
            