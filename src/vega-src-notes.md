# Vega Notes

## src/svg/marks.js

Returns (along with other things) a set of draw methods, called by the renderer,
for example:

    prototype.draw = function(ctx, scene, index) {
        var marktype = scene.marktype,
            renderer = vg.svg.marks.draw[marktype];
        renderer.call(this, ctx, scene, index);
    };

The renderer's draw method is called by its render method, e.g.

    prototype.render = function(scene, items) {
        vg.svg._cur = this;

        if (items) this.renderItems(vg.array(items));
        else this.draw(this._ctx, scene, -1);
        this.updateDefs();

        delete vg.svg._cur;
    };

And for many items:

    prototype.renderItems = function(items) {
        var item, node, type, nest, i, n,
            marks = vg.svg.marks;

        for (i=0, n=items.length; i<n; ++i) {
            item = items[i];
            node = item._svg;
            type = item.mark.marktype;

            item = marks.nested[type] ? item.mark.items : item;
            marks.update[type].call(node, item);
            marks.style.call(node, item);
        }
    }

The `draw[type]` method calls the marks draw method, with the type mapped to
the tag.

      line:    draw("path", line, true),
      text:    draw("text", text),

The `draw` method returns a function taking three arguments, 

