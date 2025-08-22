<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	/* 修复uni-app的image组件在H5平台上的样式问题 */
	uni-image {
		display: inline-block;
	}
	
	/* 确保图片正确显示，特别是头像图片 */
	uni-image[mode="aspectFill"] div,
	uni-image[mode="aspectFill"] img {
		object-fit: cover !important;
		background-size: cover !important;
		background-position: center center !important;
	}
</style>
