/*
* created by zhongzikuli<hgb102xlg@126.com> on 17/10/9.
* */
(function ($) {
    var defaultOptions = {
        containerId: 'uploadContainer',
        auto: false,
        dnd: '',
        dropTip: '允许拖到这里',
        buttonText: '选择文件',
        fileNumLimit: 1,						//设置添加文件的总数
        fileTypes: "image/jpg,image/jpeg,image/png",					//设置文件类型
        compress: false,//是否启用压缩
        /* mimeTypes		: "application/zip",*/		//文件类型 			// 防止文件选择框弹出过慢，需要放到后台进行校验
        fileSizeLimit: 10485760,				//设置文件总大小
        fileSingleSizeLimit: 10485760,			//设置单个文件大小
        fileTotalSize: 0,						//添加的文件总大小
        //文件上传请求的参数，每次发送都会发送此参数，默认：1：图片
        formData: {filetype: 1},
        chunked: false,   // 开起分片上传
        chunkSize: 5242880, //设置分片大小，默认大小为5M
        // thumbWidth: 110,						//缩略图宽度
        // thumbHeight: 110,						//缩略图高度
        crop: false, 		// 是否允许裁剪
        allowMagnify: false, 		// 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
        paste: null,		//指定监听paste事件的容器，如果不指定，不启用此功能。此功能为通过粘贴来添加截屏的图片。建议设置为document.body,默认值：undefined
        swf: 'webuploader/Uploader.swf',
        //initData		:[{}],

        disableGlobalDnd: true,//是否禁掉整个页面的拖拽功能，如果不禁用，图片拖进来的时候会默认被浏览器打开。默认值：false
        //如果某个分片由于网络问题出错，允许自动重传多少次？
        chunkRetry: 3,
        server: '/fdfs/uploadFile.action',
        //文件上传方式，POST或者GET,默认：POST
        method: 'POST',
        //设置文件上传域的name,默认：'file'
        fileVal: 'file',
        //是否为图片上传
        uploadImg: false,
        //去重， 根据文件名字、文件大小和最后修改时间来生成hash Key,默认值：undefined
        duplicate: true,
        //成功回调
        successCallBack: function () {
            return true;
        },
        //失败回调
        errorCallBack: null
    };

    function upload(options) {
        this.options = $.extend({}, defaultOptions, options || {});
        //动态初始化配置项
        this.options.dnd = options.containerId + " " + ".queueList";
        this.options.pick = options.containerId + "-" + "picker";
        //优化retina, 在retina下这个值是2
        //var ratio = window.devicePixelRatio || 1;
        // 缩略图大小
        //this.options.thumbnailWidth = options.thumbWidth * ratio;
        // this.options.thumbnailHeight = options.thumbHeight * ratio;
        this.options.supportTransition = (function () {
            var s = document.createElement('p').style,
                r = 'transition' in s ||
                    'WebkitTransition' in s ||
                    'MozTransition' in s ||
                    'msTransition' in s ||
                    'OTransition' in s;
            s = null;
            return r;
        })();
        //所有文件的进度信息，key为file id
        this.options.percentages = {};
        //初始化html
        prepareContentHtml(this.options);
        //初始化数据
        initComponentData(this.options);

        //初始化上传控件
        this.uploader = initComponent(this.options);
        //初始化事件
        initEvent(this.uploader, this.options);
        //初始化分片上传
        //initChunkUploader(this.options);
        return this;
    }

    function prepareContentHtml(option) {
        //上传区域
        if (option.containerId) {
            var picker = option.pick.substring(1);
            var uploadHtml = '<div class="queueList">' +
                '<div class="placeholder">' +
                '<p>' + option.dropTip + '</p>' +
                '</div>' +
                '<ul class="fileList"></ul>' +
                '</div>' +
                '<div class="statusBar"><div class="btns">' +
                '<div id="' + picker + '"><i class="fa fa-cloud-upload" style="margin-right:5px"></i>' + option.buttonText + '</div>' +
                '</div></div>';
            $(option.containerId).html(uploadHtml);
        }
    }

    //初始化组件
    function initComponent(options) {
        if (!WebUploader.Uploader.support()) {
            alertDialog("Web Uploader 不支持您的浏览器！如果你使用的是IE浏览器，请尝试升级 flash 播放器");
            return;
        }
        return WebUploader.create(options);
    }

    //初始化数据
    function initComponentData(options) {
        if (options.initData && options.initData.length > 0) {
            var arrData = options.initData;
            for (var i = 0; i < arrData.length; i++) {
                var obj = arrData[i];
                var fileName = obj["fileName"];
                var extStart = fileName.lastIndexOf(".");
                var ext = fileName.substring(extStart, fileName.length).toUpperCase();

                if (ext != ".BMP" && ext != ".PNG" && ext != ".JPG" && ext != ".JPEG") {
                    var $li = $('<li class="state-complete" id="E_FILE_' + obj.fileId + '" data-group="' + obj.fileGroup + '" ' +
                        'data-filepath="' + obj.filePath + '" data-fileName="' + obj.fileName + '">' +
                        '<p class="title">' + obj.fileName + '</p>' +
                        '<p class="imgWrap"><img id="vtipArrow" src="' + "/styles/images/zip.png" + '"></p>' +
                        '<div class="file-panel"><span class="cancel">删除</span></div></li>');
                } else {
                    var $li = $('<li class="state-complete" id="E_FILE_' + obj.fileId + '" data-group="' + obj.fileGroup + '" ' +
                        'data-filepath="' + obj.filePath + '" data-fileName="' + obj.fileName + '">' +
                        '<p class="title">' + obj.fileName + '</p>' +
                        '<p class="imgWrap"><img src="/"><' + staticUrl + obj.fileGroup + "/" + obj.filePath + 'p>' +
                        '<div class="file-panel"><span class="cancel">删除</span></div></li>');
                }
                $(options.containerId).find(".fileList").append($li);
            }
            $(options.containerId).find(".placeholder").addClass('element-invisible');
        }
        $(".state-complete").hover(function () {
            $(this).find(".file-panel").stop().animate({height: 30});
        }, function () {
            $(this).find(".file-panel").stop().animate({height: 0});
        });

        var cancel = $(".state-complete").find(".cancel");
        cancel.on("click", function () {
            var id = $(this).parents(".state-complete").attr("id");
            return editRemove(options, id);
        });
    }

    function initChunkUploader(options) {
        var fileMd5;
        //监听分块上传过程中的三个时间点
        WebUploader.Uploader.register({
            "before-send-file": "beforeSendFile",
            "before-send": "beforeSend",
            "after-send-file": "afterSendFile",
        }, {
            //时间点1：所有分块进行上传之前调用此函数
            beforeSendFile: function (file) {
                var deferred = WebUploader.Deferred();
                //1、计算文件的唯一标记，用于断点续传
                (new WebUploader.Uploader()).md5File(file, 0, options.chunkSize)
                    .progress(function (percentage) {
                    })
                    .then(function (val) {
                        fileMd5 = val;
                        //获取文件信息后进入下一步
                        deferred.resolve();
                    });
                return deferred.promise();
            },
            //时间点2：如果有分块上传，则每个分块上传之前调用此函数
            beforeSend: function (block) {
                var deferred = WebUploader.Deferred();
                $.ajax({
                    type: "POST",
                    url: "/fdfs/checkChunk.action",
                    data: {
                        //文件唯一标记
                        fileMd5: fileMd5,
                        //当前分块下标
                        chunk: block.chunk,
                        //当前分块大小
                        chunkSize: block.end - block.start
                    },
                    dataType: "json",
                    success: function (result) {
                        if (result.error == 1) {
                            //分块存在，跳过
                            deferred.reject();
                        } else {
                            //分块不存在或不完整，重新发送该分块内容
                            deferred.resolve();
                        }
                    }
                });
                this.owner.options.formData.fileMd5 = fileMd5;
                deferred.resolve();
                return deferred.promise();
            },
            //时间点3：所有分块上传成功后调用此函数
            afterSendFile: function (file) {
                //如果分块上传成功，则通知后台合并分块
                $.ajax({
                    type: "POST",
                    url: "/fdfs/mergeChunks.action",
                    data: {
                        fileMd5: fileMd5
                    },
                    dataType: "json",
                    success: function (result) {
                        if (result.error == 1) {
                            var $file = $("#" + file.id);
                            var v = result.rows.split(",");
                            $file.data("group", v[0]);
                            $file.data("filepath", v[1]);
                            $file.data("filename", v[2]);
                            successMsg(result.message);
                        } else {
                            faildMsg(result.message);
                        }
                    }, error: function (result) {
                        faildMsg(result.message);
                    }
                });
            }
        });
    }

    function initEvent(uploader, option) {
        /**组件变量定义*/
        var $statusBar = $(option.containerId).find(".statusBar"),			//存放文件大小和进度条的div
            //$info = $statusBar.find(".info"),								//存放文件大小的描述信息的div
            $placeholder = $(option.containerId).find(".placeholder"),
            fileCount = $(option.containerId).find(".fileList li").length;	//添加的文件数

        /**事件定义*/
        //文件加入队列后删除时触发
        uploader.onFileQueued = function (file) {
            fileCount++;
            option.fileTotalSize += file.size;
            $placeholder.addClass("element-invisible");
            $statusBar.show();
            addFile(uploader, file);
            updateTotalProgress(option);
        };

        //文件加入队列前触发
        uploader.onBeforeFileQueued = function (file) {
//            if (fileCount >= option.fileTotalCount) {
//                alertDialog("文件数量超出限定值：" + option.fileTotalCount);
//                return;
//            }
        };

        // 文件上传过程中创建进度条实时显示。
        uploader.onUploadProgress = function (file, percentage) {
            var $file = $("#" + file.id),
                $percent = $file.find(".progress span");

            // 避免重复创建
            if (!$percent.length && $file.length > 0) {
                $percent = $('<p class="progress"><span></span></p>').appendTo($file).find('span');
            }

            $percent.css("width", 100 * percentage + "%");

            option.percentages[file.id] = percentage;
            updateTotalProgress(option);
        };

        //文件从队列后删除时触发
        uploader.onFileDequeued = function (file) {
            fileCount--;
            option.fileTotalSize -= file.size;
            removeFile(file, option);
            updateTotalProgress(option);
            $li_count = $(option.containerId).find(".fileList li").length;
            removePlaceClass($li_count, fileCount, option);
        };
        //拖拽时不接受 js, txt 文件。
        uploader.on('dndAccept', function (items) {
            var denied = false,
                len = items.length,
                i = 0,
                // 修改js类型
                unAllowed = 'text/plain;application/javascript ';

            for (; i < len; i++) {
                // 如果在列表里面
                if (~unAllowed.indexOf(items[i].type)) {
                    denied = true;
                    break;
                }
            }
            return !denied;
        });

        //文件上传成功后触发
        uploader.onUploadSuccess = function (file, response) {
            if (option.initData && option.fileNumLimit == 1) {
                $(".fileList").find("li:not(:last-child)").remove();
            }
            var $file = $("#" + file.id);
            var $queueList = $file.parents(".queueList");
            var tLine = $queueList.parents(".two-line");
            if (response.error == 1) {
                $queueList.removeClass("wrong");
                if (typeof response.rows === 'string') {
                    var result = response.rows.split(",");
                    $file.attr({
                        'data-group': result[0],
                        'data-filepath': result[1],
                        'data-filename': result[2]
                    });
                } else if (response.rows instanceof Array) {
                    if (response.rows.length > 0) {
                        for (var i = 0; i < response.rows.length; i++) {
                            $('<p class="error-tip" title="' + response.rows[i].message + '">第 ' + response.rows[i].rowNum + ' 行第 ' + response.rows[i].cellNum + ' 列,' + response.rows[i].message + '</p>').appendTo('.fileList')
                        }
                    }
                }
                if (typeof(option.onSucessCallback) === "function") {
                    option.onSucessCallback(response);
                }
            } else if (response.error == -1) {
                $queueList.children(".placeholder").removeClass("element-invisible");
                $file.parent(".fileList").empty().html('<p class="error" title="' + response.message + '">' + response.message + '</p>');
                if (tLine.length > 0) {
                    $("p.error").css({
                        'position': 'relative',
                        'margin-top': 82 + 'px'
                    })
                }
                uploader.removeFile(file, option);

            } else if (response.error == -100) {
                faildMsg("会话超时，请重新登陆！");
            } else {
                faildMsg(response.message);
            }
        };
        //文件上传失败后触发
        uploader.onUploadError = function (file, response) {
            if (response.error == -1) {
                var $file = $("#" + file.id);
                $file.find("span.success").remove();
                $('<p class="error">' + response.message + '</p>').appendTo($file);
            } else {
                faildMsg(response.message);
            }
        };
        //当文件上传出错时触发
        uploader.onError = function (reason) {
            if ("Q_EXCEED_NUM_LIMIT" === reason) {
                alertDialog("文件数量超出限定值：" + option.fileNumLimit);
            }
            if ("Q_TYPE_DENIED" === reason) {
                alertDialog("文件类型不符合限定值：" + option.fileTypes);
            }
            if ("Q_EXCEED_SIZE_LIMIT" === reason) {
                alertDialog("文件总大小超出限定值：" + option.fileSizeLimit / (1024 * 1024) + "M");
            }
            if ("F_EXCEED_SIZE" === reason) {
                alertDialog("单个文件大小超出限定值：" + option.fileSingleSizeLimit / (1024 * 1024) + "M");
            }
        };
        //不管成功或者失败，文件上传完成时触发
        uploader.onUploadComplete = function (file) {
            $('#' + file.id).find('.progress').remove();
        };
        //当所有文件上传结束时触发
        uploader.onUploadFinished = function (file) {
            // console.log(file);
        }
    }

    //从fasdfs服务器删除文件
    function deleteFileFromFASDFS(group, filePath) {
        if (group == undefined || filePath == undefined || group == '' || filePath == '') {
            return;
        }
        $.ajax({
            url: "/fdfs/deleteFdfsFile.action",
            type: "post",
            data: {groupName: group, fileId: filePath},
            dataType: "json",
            success: function (data) {
                if (data.error == -1) {
                    faildMsg(data.message);
                } else {
                    successMsg(data.message);
                }
            }
        });
    }

    //添加文件，并展示缩略图
    function addFile(uploader, file) {
        var option = uploader.options;
        //var liLength = $(option.containerId).find(".fileList").find(".state-complete").length;

        var $li = $('<li id="' + file.id + '"><p class="title">' + file.name + '</p><p class="imgWrap"></p><p class="progress"><span></span></p></li>');
        if (option.fileTypes && option.fileTypes != "image/jpg,image/jpeg,image/png") {
            var $btns = $('<div class="file-panel"><span class="cancel">删除</span></div>').appendTo($li);
        } else {
            var $btns = $('<div class="file-panel"><span class="cancel">删除</span><span class="rotateRight">向右旋转</span><span class="rotateLeft">向左旋转</span></div>').appendTo($li);
        }
        var progress = $li.find("p.progress span"),
            $img = $li.find("p.imgWrap"),
            $error = $('<p class="error"></p>'),
            showError = function (e) {
                switch (e) {
                    case"exceed_size":
                        text = "文件大小超出";
                        break;
                    case"interrupt":
                        text = "上传暂停";
                        break;
                    default:
                        text = "上传失败，请重试"
                }
                $error.text(text).appendTo($li);
            };
        if ("invalid" === file.getStatus()) {
            showError(file.statusText);
        } else {
            //$img.text("预览中");
        }
        //生成缩略图，此过程为异步，所以需要传入callback。 通常情况在图片加入队里后调用此方法来生成预览图以增强交互效果。
        uploader.makeThumb(file, function (error, ret) {
            if (error) {
                $img.append('<img id="vtipArrow" src="' + "/styles/images/zip.png" + '"/>');
            } else {
                $img.empty().append('<img src="' + ret + '" />');
            }
        }, 1, 1);

        option.percentages[file.id] = [file.size, 0];
        file.rotation = 0;
        file.on('statuschange', function (cur, prev) {
            // 成功
            if (cur === 'error' || cur === 'invalid') {
                showError(file.statusText);
                option.percentages[file.id][1] = 1;
            } else if (cur === 'interrupt') {
                showError('interrupt');
            } else if (cur === 'queued') {
                $error.remove();
                progress.css('display', 'block');
                option.percentages[file.id][1] = 0;
            } else if (cur === 'progress') {
                $error.remove();
                progress.css('display', 'block');
            } else if (cur === 'complete') {
                progress.hide().width(0);
                $li.append('<span class="success"></span>');
            }

            $li.removeClass('state-' + prev).addClass('state-' + cur);
        });
        //当鼠标移动到缩略图片触发事件
        $li.on("mouseenter", function () {
            $btns.stop().animate({height: 30});
        });
        $li.on("mouseleave", function () {
            $btns.stop().animate({height: 0});
        });

        $btns.on("click", "span", function () {
            var deg, s = $(this).index();
            switch (s) {
                case 0:
                    //移除文件
                    if ("complete" === file.getStatus()) {
                        var group = $("#" + file.id).data("group");
                        var filePath = $("#" + file.id).data("filepath");
                        deleteFileFromFASDFS(group, filePath);
                    }
                    return uploader.removeFile(file, option);
                case 1:
                    file.rotation += 90;
                    break;
                case 2:
                    file.rotation -= 90;
            }
            if (option.supportTransition) {
                deg = 'rotate(' + file.rotation + 'deg)';
                $img.css({
                    '-webkit-transform': deg,
                    '-mos-transform': deg,
                    '-o-transform': deg,
                    'transform': deg
                });
            } else {
                $img.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
            }
        });

        var $fileList = $(option.containerId).find(".fileList");
        if ($fileList.find("p.error").length > 0) {
            $fileList.find("p.error").remove()
        }
        // $fileList = $fileList.find("p.error");
        $li.appendTo($fileList);

        //重试上传，重试指定文件，或者从出错的文件开始重新上传
        $(option.containerId).find(".placeholder").on("click", ".retry", function () {
            uploader.retry();
        });
    }

    function removePlaceClass($li_count, fileCount, option) {
        if (fileCount == 0 && $li_count == 0) {
            $(option.containerId).find(".placeholder").removeClass("element-invisible");
        }
    }

    function removeFile(file, option) {
        $(option.containerId).find(".fileList .error-tip").remove();
        var liLength = $(option.containerId).find(".fileList").find("li").length;
        var $li = $("#" + file.id);
        delete option.percentages[file.id];
        updateTotalProgress(option);
        $li.off().find(".file-panel").off().end().remove();
        if (liLength > 1) {
            $(option.containerId).find(".placeholder").hide();
        } else {
            $(option.containerId).find(".placeholder").show().removeClass('element-invisible');
        }
    }

    //编辑删除时用到
    function editRemove(option, liId) {
        var arrData = option.initData;
        var fileId = null;
        for (var i = 0; i < arrData.length; i++) {
            var obj = arrData[i];
            fileId = 'E_FILE_' + obj["fileId"];
            if (fileId == liId) {
                var $li = $(option.containerId).find(".state-complete");
                delete option.percentages[liId];
                updateTotalProgress(option);
                $("#" + liId).find(".file-panel").off().end().remove();
                if ($li.length == 1) {
                    $(option.containerId).find(".placeholder").removeClass('element-invisible');
                }
            }
        }
    }

    function updateTotalProgress(option) {
        var $statusBar = $(option.containerId).find(".statusBar");			//存放文件大小和进度条的div
        var $progress = $statusBar.find(".progress").hide();				//上传文件的进度条
        var percent, loaded = 0, total = 0, $span = $progress.children();
        $.each(option.percentages, function (e, i) {
            total += i[0];
            loaded += i[0] * i[1];
        });
        percent = total ? loaded / total : 0;
        $span.eq(0).text(Math.round(100 * percent) + "%");
        $span.eq(1).css("width", Math.round(100 * percent) + "%");
        $progress.show();
    }

    window.uploaderFile = upload;
})($);