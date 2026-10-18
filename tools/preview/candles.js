export const TRADES_PER_CANDLE = 3;
export function candlesFromFills(fills, limit=24) {
  const candles=[];
  for(let i=0;i<fills.length;i++){
    const f=fills[i];
    if(i%TRADES_PER_CANDLE===0)candles.push({open:f.price,high:f.price,low:f.price,close:f.price,volume:f.quantity,firstFill:i+1,lastFill:i+1});
    else{const c=candles.at(-1);c.high=Math.max(c.high,f.price);c.low=Math.min(c.low,f.price);c.close=f.price;c.volume+=f.quantity;c.lastFill=i+1;}
  }
  return candles.slice(-limit);
}
export function candleLayout(candles,{x=24,y=90,width=500,height=240,slots=24}={}){
  const values=candles.flatMap(c=>[c.low,c.high]);
  const lo=values.length?Math.min(...values):9900,hi=values.length?Math.max(...values):10100;
  const padding=Math.max(12,(hi-lo)*.16),min=lo-padding,max=hi+padding;
  const priceY=p=>y+(max-p)/(max-min)*height;
  const step=width/slots;
  return {min,max,priceY,bars:candles.map((c,i)=>({x:x+width-step*(candles.length-i-.5),width:Math.max(3,step*.62),openY:priceY(c.open),closeY:priceY(c.close),highY:priceY(c.high),lowY:priceY(c.low),up:c.close>=c.open,candle:c}))};
}
export function candleSvg(fills,{width=760,height=235}={}){
  const candles=candlesFromFills(fills),layout=candleLayout(candles,{x:10,y:18,width:width-80,height:height-45});
  let result='';
  for(let i=0;i<4;i++){const p=layout.min+(layout.max-layout.min)*i/3,y=layout.priceY(p);result+=`<line x1="10" x2="${width-70}" y1="${y}" y2="${y}" stroke="#b6d5bc19" stroke-dasharray="3 6"/><text x="${width-60}" y="${y+4}" fill="#90a48d" font-family="monospace" font-size="10">${(p/100).toFixed(2)}</text>`;}
  for(const b of layout.bars){const color=b.up?'#baf16e':'#ed8f85';result+=`<line x1="${b.x}" x2="${b.x}" y1="${b.highY}" y2="${b.lowY}" stroke="${color}" stroke-width="1.5"/><rect x="${b.x-b.width/2}" y="${Math.min(b.openY,b.closeY)}" width="${b.width}" height="${Math.max(2,Math.abs(b.closeY-b.openY))}" fill="${color}"/>`;}
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${result}</svg>`;
}

