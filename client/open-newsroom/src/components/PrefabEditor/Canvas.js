import { Container } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import './PrefabEditor.css'

export default function Canvas(props) {
  const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
  const [canvasPos, setCanvasPos] = useState({top: 0, left: 0})
  const [zoom, setZoom] = useState(props.zoom)
  
  function centerCanvas() {
    window.scroll(
      //(canvasSize.width/2)-((canvas.clientWidth*scale)/2)+8.5,
      //(canvasSize.height/2-((canvas.clientHeight*scale)/2))-((window.innerHeight - canvas.clientHeight*scale)/2)+8.5
    )
  }

  function calcCanvasSize() {
    setCanvasSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
    return ({width: window.innerWidth, height: window.innerHeight})
  }

  function calcCentre() {
    let realCanvasSize = calcCanvasSize()
    setCanvasPos({
      top: ((realCanvasSize.height - 64) / 2) - ((props.canvasInfo.height * zoom) / 2) ,
      left: ((realCanvasSize.width - 47) / 2) - ((props.canvasInfo.width * zoom) / 2)
    })
    console.log(realCanvasSize)
  }

  useEffect(() => {
    calcCentre()
  }, [props.recentre, calcCentre])

  useEffect(() => {
    setZoom(props.zoom)
  }, [props.zoom])

  useEffect(() => {
    calcCanvasSize()
    calcCentre()
  }, [])

  return (
    <Container className="canvasContainer">
      <div className="canvasInnerContainer">
        <canvas
          width={props.canvasInfo.width}
          height={props.canvasInfo.height}
          className="editingCanvas"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            position: 'relative',
            top: `${canvasPos.top}px`,
            left: `${canvasPos.left}px`
          }}
        ></canvas>
      </div>
    </Container>
  );
}