import { Container } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import './PrefabEditor.css'

export default function Canvas(props) {
  const [canvasPos, setCanvasPos] = useState({top: 0, left: 0})
  const [zoom, setZoom] = useState(props.zoom)

  const calcCentre = useCallback(() => {
    let realCanvasSize = {width: window.innerWidth, height: window.innerHeight}
    setCanvasPos({
      top: ((realCanvasSize.height - 64) / 2) - ((props.canvasInfo.height * zoom) / 2) ,
      left: ((realCanvasSize.width - 47) / 2) - ((props.canvasInfo.width * zoom) / 2)
    })
    console.log(realCanvasSize)
  }, [zoom, props])

  useEffect(() => {
    calcCentre()
  }, [props.recentre, calcCentre])

  useEffect(() => {
    setZoom(props.zoom)
  }, [props.zoom])

  useEffect(() => {
    calcCentre()
  }, [calcCentre])

  return (
    <Container
      fixed
      disableGutters
      className="canvasContainer"
      style={{minWidth: window.innerWidth, minHeight: window.innerHeight}}
    >
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