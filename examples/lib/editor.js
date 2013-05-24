var ved = {
  version: 0.1,
  data: undefined,
  renderType: "svg"
};

ved.params = function() {
  return location.search.slice(1)
    .split("&")
    .map(function(x) { return x.split("="); })
    .reduce(function(a, b) {
      a[b[0]] = b[1]; return a;
    }, {});
};

ved.select = function() {
  var sel = document.getElementById("sel_spec"),
      idx = sel.selectedIndex,
      uri = sel.options[idx].value;

  if (idx > 0) {
    d3.xhr(uri, function(error, response) {
      d3.select("#spec").property("value", response.responseText);
      ved.parse();
    });
  } else {
    d3.select("#spec").property("value", "");
  }
};

ved.renderer = function() {
  var sel = document.getElementById("sel_render"),
      idx = sel.selectedIndex,
      ren = sel.options[idx].value;

  ved.renderType = ren;
  ved.parse();
};

ved.format = function(event) {
  var el = d3.select("#spec"),
      spec = JSON.parse(el.property("value")),
      text = JSON.stringify(spec, null, 2);
  el.property("value", text);
};

ved.parse = function() {
  var spec, source;
  try {
    spec = JSON.parse(d3.select("#spec").property("value"));
  } catch (e) {
    console.log(e);
    return;
  }
  
  vg.parse.spec(spec, function(chart) {
    d3.select("#vis").selectAll("*").remove();
    var view = chart({
      el: "#vis",
      data: ved.data,
      renderer: ved.renderType,
      hover: false
    });
      (ved.view = view).update({"duration":500})
      .on("click", d3click )
      .on("mouseover", transitionOver)
      .on("mouseout" , transitionOut )
// These are the default by "hover: true" in the constructor
//      .on("mouseover", function(event, item) { view.update({props: "hover", items: item, duration: 200}) } )
//      .on("mouseout" , function(event, item) { view.update({props: "update", items: item, duration: 200}) } )
;
  });
};

transitionOver = function(event, item) {
    d3.select(item._svg)
	.transition()
	.duration(200)
	.style("fill", "black");
    d3.select((item._svg).parentNode)
	.append("text")
	.attr("x", (item.x))
	.attr("y", (item.y - 12))
	.attr("dy", ".9em")
	.attr("width", 20).attr("height",20)
	.style("fill", "black")
	.attr("class","label")
	.text(item.datum.data.y);
    console.log(item.datum.data.y);
}
transitionOut = function(event, item) {
      d3.select(item._svg)
	.transition()
	.duration(200)
	.style("fill", item.fill);
    d3.select((item._svg).parentNode)
	.select(".label")
	.remove();
}

d3click = function(event, item) {
    console.log(item);
    d3.select(item._svg)
	.transition()
	.duration(500)
	.style("fill", "black");
}


ved.resize = function(event) {
  var h = window.innerHeight - 30;
  d3.select("#spec").style("height", h+"px");
};

ved.init = function() {
  // Specification drop-down menu               
  var sel = d3.select("#sel_spec");
  sel.on("change", ved.select);
  sel.append("option").text("Custom");
  sel.selectAll("option.spec")
    .data(SPECS)
   .enter().append("option")
    .attr("value", function(d) { return "vega/"+d+".json"; })
    .text(function(d) { return d; });

  // Renderer drop-down menu
  var ren = d3.select("#sel_render");
  ren.on("change", ved.renderer)
  ren.selectAll("option")
    .data(["SVG", "Canvas"])
   .enter().append("option")
    .attr("value", function(d) { return d.toLowerCase(); })
    .text(function(d) { return d; });

  // Initialize application
  d3.select("#btn_spec_format").on("click", ved.format);
  d3.select("#btn_spec_parse").on("click", ved.parse);
  d3.select(window).on("resize", ved.resize);
  ved.resize();
  
  // Handle application parameters
  var p = ved.params();
  if (p.spec) {
    var idx = SPECS.indexOf(p.spec) + 1;
    if (idx > 0) {
      sel.node().selectedIndex = idx;
      ved.select();
    }
  }
};

window.onload = ved.init;
