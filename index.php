<?php

?>

<html>
<head>
<title>Hitman | A Control Group Tool</title>
	<link rel="stylesheet" href="css/style.css" />
	<script type="text/javascript" src="js/jquery.min.js"></script>
    <script type="text/javascript" src="js/jquery.easing.1.3.js"></script>
    <script type="text/javascript" src="js/functions.js"></script>
</head>
<body>
	<div id="canvas_container" align="center">
		<canvas id="hit_canvas"></canvas>
	</div>

	<!-- INFOMATIC OVERLAYS ... -->
	<div id="infomatics">
		<div id="info">
			<span id="temperature_label"></span><br/>
			<span id="temperatureHigh_text">0&deg;</span><span style="font-size:16px">High</span><br/>
			<span id="temperatureCurrent_text">0&deg;</span><span style="font-size:25px">Current</span><br/>
			<span id="temperatureLow_text">0&deg;</span><span style="font-size:16px">Low</span>
		</div>
	</div>

	<!-- ALL TESTS SUMMARY -->
	<div id="all_summary" style="display:none">
		<table>
			<tr id="test1" >
				<td>
					<span>Test 1:</span><br/>
					<div id="test1_results" class="results">
						<div>
							<canvas id="min" ></canvas><br/>
							<span id="min_value">Min:</span>
						</div>
						<div>
							<canvas id="max" ></canvas>
							<span id="max_value">Max:</span>
						</div>
						<div>
							<canvas id="mean" ></canvas>
							<span id="mean_value">Mean:</span>
						</div>
						<div>
							<canvas id="median" ></canvas>
							<span id="median_value">Median:</span>
						</div>
					</div>
				</td>
			</tr>
			<tr id="test2" >
				<td>
					<span>Test 2:</span><br/>
					<div id="test2_results" class="results">
					</div>
				</td>
			</tr>
			<tr id="test3" >
				<td>
					<span>Test 3:</span><br/>
					<div class="results"></div>
				</td>
			</tr>
		</table>
	</div>

	<!-- MENUS -->
	<div id="menus">
		<div id="test_menu">
			<select id="test_selector" onchange="handleTestMenu(this)">
			  <option value="0">Select a test...</option>
			  <option value="1">Run: Touch Point Probability</option>
			  <option value="2">Run: Random Point Timed Test</option>
			  <option value="3">Test 3</option>
			</select>
		</div>

		<!-- ACTION MENU -->
		<div id="action_menu">
			<select id="action_selctor" onchange="handleActionMenu(this)">
			  <option value="0">System Actions...</option>
			  <option value="1">Clear Test</option>
			  <option value="2">Reset System</option>
			</select>
		</div>

		<!-- EXTRA OPTIONS -->
		<div id="extra_menu" style="display:block">
			<button id="analyze_btn" value="Debrief" onclick="analyzeData();">Debrief</button>
		</div>
	</div>
	<!-- END MENUS
</body>
</html>	
