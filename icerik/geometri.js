Game.Geometry = {
    getLine: function(startX, startY, endX, endY){
        var points = [];
        var dx = Math.abs(endX - startX);
        var dy = Math.abs(endY - startY);
        var sx = (startX < endX) ? 1 : -1;
        var sy = (startY < endY) ? 1 : -1;
        var hata = dx - dy;
        var h2;

        while(true){
            points.push({x: startX, y: startY});
            if(startX == endX && startY == endY){
                break;
            }
            h2 = hata * 2;
            if(h2 > -dx){
                hata -=dy;
                startX += sx;
            }
            if(h2 < dx){
                hata +=dx;
                startY += sy;
            }
        }
        return points;
    }
};