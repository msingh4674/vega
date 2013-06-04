vg.svg.marks = (function() {

  function x(o)     { return o.x || 0; }
  function y(o)     { return o.y || 0; }
  function yh(o)    { return o.y + o.height || 0; }
  function key(o)   { return o.key; }
  function size(o)  { return o.size==null ? 100 : o.size; }
  function shape(o) { return o.shape || "circle"; }
      
  var arc_path    = d3.svg.arc(),
      area_path   = d3.svg.area().x(x).y1(y).y0(yh),
      line_path   = d3.svg.line().x(x).y(y),
      symbol_path = d3.svg.symbol().type(shape).size(size);
  
  var mark_id = 0;
  
  var textAlign = {
    "left":   "start",
    "center": "middle",
    "right":  "end"
  };
  
  var styles = {
    "fill":          "fill",
    "fillOpacity":   "fill-opacity",
    "stroke":        "stroke",
    "strokeWidth":   "stroke-width",
    "strokeOpacity": "stroke-opacity",
    "opacity":       "opacity"
  };
  var styleProps = vg.keys(styles);

  function style(d) {
    var o = d.mark ? d : d[0],
        i, n, prop, name, value;

    for (i=0, n=styleProps.length; i<n; ++i) {
      prop = styleProps[i];
      name = styles[prop];
      value = o[prop];

      if (value == null) {
        if (name === "fill") this.style.setProperty(name, "none", null);
        else this.style.removeProperty(name);
      } else {
        if (value.id) {
          // ensure definition is included
          vg.svg._cur._defs[value.id] = value;
          value = "url(#" + value.id + ")";
        }
        this.style.setProperty(name, value, null);
      }
    }
  }
  
  function arc(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", arc_path(o));
  }
  
  function area(items) {
    var o = items[0];
    area_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == undefined ? 0.7 : o.tension);
    this.setAttribute("d", area_path(items));
  }
  
  function line(items) {
    var o = items[0];
    line_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == undefined ? 0.7 : o.tension);
    this.setAttribute("d", line_path(items));
  }
  
  function path(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", o.path);
  }

  function rect(o) {
    this.setAttribute("x", o.x || 0);
    this.setAttribute("y", o.y || 0);
    this.setAttribute("width", o.width || 0);
    this.setAttribute("height", o.height || 0);
  }

  function rule(o) {
    var x1 = o.x || 0,
        y1 = o.y || 0;
    this.setAttribute("x1", x1);
    this.setAttribute("y1", y1);
    this.setAttribute("x2", o.x2 !== undefined ? o.x2 : x1);
    this.setAttribute("y2", o.y2 !== undefined ? o.y2 : y1);
  }
  
  function symbol(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", symbol_path(o));
  }
  
  function image(o) {
    var w = o.width || (o.image && o.image.width) || 0,
        h = o.height || (o.image && o.image.height) || 0,
        x = o.x - (o.align === "center"
          ? w/2 : (o.align === "right" ? w : 0)),
        y = o.y - (o.baseline === "middle"
          ? h/2 : (o.baseline === "bottom" ? h : 0));
    
    this.setAttributeNS("http://www.w3.org/1999/xlink", "href", o.url);
    this.setAttribute("x", x);
    this.setAttribute("y", y);
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }
    
  function fontString(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != undefined ? o.fontSize + "px " : "11px ")
      + (o.font || "sans-serif");
  }
  
  function text(o) {
    var x = o.x || 0,
        y = o.y || 0,
        dx = o.dx || 0,
        dy = o.dy || 0,
        a = o.angle || 0,
        align = textAlign[o.align || "left"],
        base = o.baseline==="top" ? ".9em"
             : o.baseline==="middle" ? ".35em" : 0;
  
    this.setAttribute("x", x + dx);
    this.setAttribute("y", y + dy);
    this.setAttribute("dy", dy);
    this.setAttribute("text-anchor", align);
    
    if (a) this.setAttribute("transform", "rotate("+a+" "+x+","+y+")");
    else this.removeAttribute("transform");
    
    if (base) this.setAttribute("dy", base);
    else this.removeAttribute("dy");
    
    this.textContent = o.text;
    this.style.setProperty("font", fontString(o), null);
    //console.log('text method', this);
  }
  
  function group(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
  }

  function group_bg(o) {
    var w = o.width || 0,
        h = o.height || 0;
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }

  /**
   *
   * @param {string} tag
   * @param {function} attr A function which adds attributes to a node
   * @param {boolean} nest ???
   */
  function draw(tag, attr, nest) {
    /**
     * @param {Array?} g The root SVG group element?
     * @param {object} scene Scene item?
     * @param {int} index The index of the item being drawn
     */
    return function(g, scene, index) {
      drawMark(g, scene, index, "mark_", tag, attr, nest);
    };
  }
  
  function drawMark(g, scene, index, prefix, tag, attr, nest) {
    var data,
        evts,
        grps,
        notG,
        p;

    // Set the data to be the scene items
    // if the mark is nested make it a one element array
    // scene.items is an array of items of ???
    data = nest ? [scene.items] : scene.items;

    // Set a flag to say whether or not events should be enabled
    // The "none" string means no pointer events, null means default pointer
    // events
    evts = scene.interactive===false ? "none" : null;

    // Get a handle to the groups child nodes
    grps = g.node().childNodes;

    // Set a flag to say whether or not the thing being drawn is not a group
    notG = (tag !== "g");

    // If there's an element in the second position in the grps array
    // select it
    // otherwise append a new group
    // Set "p" to be the result of the select/append
    // p is an (extended) SVG element
    p = (p = grps[index+1]) // +1 to skip group background rect
      ? d3.select(p)
      : g.append("g").attr("id", "g"+(++mark_id));

    // Create a selector for all tags of type "tag" that are direct decendencts
    // of the previously selected "p" attribute
    // Select it and set the data
    // Enter the data and then append the tag
    var id = "#" + p.attr("id"),
        // s is a selector
        s = id + " > " + tag,
        // m is the d3 selection with the data "attached"
        m = p.selectAll(s).data(data),
        // e is the result of creating the entering selection and then calling
        // append to create nodes of type "tag"
        e = m.enter().append(tag);

    if (notG) {
      // Set pointer events to null, ie the default behaviour
      p.style("pointer-events", evts);

      // For each node in the current selection
      // "d" is the current datum
      e.each(function(d) {
          // Add a reference to "this" under the _svg property
          (d.mark ? d : d[0])._svg = this;
      });
    } else {
      e.append("rect").attr("class","background").style("pointer-events",evts);
    }

    // ???
    m.exit().remove();

    // Calls the attr function on each of the selected elements, adding the
    // appropriate element attributes
    m.each(attr);

    // If the element is not a tag, call the style function on each of the
    // selected elements
    if (notG) m.each(style);
    else p.selectAll(s+" > rect.background").each(group_bg).each(style);
    
    // ???
    // p is the SVG element but need to understand why it's returned here?
    return p;
  }

  function drawGroup(g, scene, index, prefix) {    
    var p = drawMark(g, scene, index, prefix || "group_", "g", group),
        c = p.node().childNodes, n = c.length, i, j, m;
    
    for (i=0; i<n; ++i) {
      var items = c[i].__data__.items,
          legends = c[i].__data__.legendItems || [],
          axes = c[i].__data__.axisItems || [],
          sel = d3.select(c[i]),
          idx = 0;

      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer === "back") {
          drawGroup.call(this, sel, axes[j], idx++, "axis_");
        }
      }
      for (j=0, m=items.length; j<m; ++j) {
        this.draw(sel, items[j], idx++);
      }
      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer !== "back") {
          drawGroup.call(this, sel, axes[j], idx++, "axis_");
        }
      }
      for (j=0, m=legends.length; j<m; ++j) {
        drawGroup.call(this, sel, legends[j], idx++, "legend_");
      }
    }
  }

  return {
    update: {
      group:   rect,
      area:    area,
      line:    line,
      arc:     arc,
      path:    path,
      symbol:  symbol,
      rect:    rect,
      rule:    rule,
      text:    text,
      image:   image
    },
    nested: {
      "area": true,
      "line": true
    },
    style: style,
    draw: {
      group:   drawGroup,
      area:    draw("path", area, true),
      line:    draw("path", line, true),
      arc:     draw("path", arc),
      path:    draw("path", path),
      symbol:  draw("path", symbol),
      rect:    draw("rect", rect),
      rule:    draw("line", rule),
      text:    draw("text", text),
      image:   draw("image", image),
      draw:    draw // expose for extensibility
    }
  };
  
})();
