import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import React from 'react'

const GhostText = (props: NodeViewProps) => {
    return (
        <NodeViewWrapper as="span">
            <span className="text-gray-300 select-none !inline">
                {props.node.attrs.content}
            </span>
        </NodeViewWrapper>
    )
}

export default GhostText