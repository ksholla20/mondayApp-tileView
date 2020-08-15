import React from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { FontWeights } from '@uifabric/styling';
import { Persona, Text } from 'office-ui-fabric-react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
const monday = mondaySdk();

const descriptionTextStyles = {
    root: {
        color: '#333333',
        fontWeight: FontWeights.semibold,
        cursor: "pointer",
        width:'100%',
    },
};
const footerTextStyles = {
    root: {
        color: '#333333',
        fontSize: 12,
        fontWeight: FontWeights.semibold,
        marginRight: "4px",
        minWidth: "20px"
    },
};

const headerStyle = {
    backgroundColor: '#c8c8c8',
    lineHeight: "40px",
    height: "40px",
    fontSize: 24,
    color: "black",
    padding: '0 20px',
    margin: '8px 0',
    border: 'ridge',
    fontWeight: FontWeights.semibold,
};

const labelStyles = {
    root: {
    backgroundColor: '#e0e0e0',
    lineHeight: "30px",
    height: "30px",
    fontSize: 16,
    color: "black",
    padding: '0 20px',
    margin: '8px 0',
    fontWeight: FontWeights.semibold,
    }
};

const getDraggableStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    width: "100%",
    // change background colour if dragging
    background: isDragging ? 'lavender' : 'burlywood',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getDroppableStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'white',
    width: "100%",
});

const tagStyle = {
    backgroundColor: "gainsboro",
    color: "dimgrey",
    fontSize: 12,
    lineHeight: "12px",
    height: 12,
    margin:"1px",
    fontWeight: "normal",
    boxSizing: "border-box",
    overflow: "hidden",
    textOverflow: "ellipsis",
    verticalAlign: "middle",
    borderRadius: 3
};

const ItemCard = (props) => {
    let imageUrl = undefined;
    if(props.userData && props.userData[props.owner])
       imageUrl = props.userData[props.owner];
    return(
        <Draggable
            draggableId={props.id}
            index={props.index}
        >
        {(provided, snapshot)=>(
        <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            style={getDraggableStyle(snapshot.isDragging, provided.draggableProps.style)}
        >
            <div style={{width:'100%', margin:"4px 0", padding:"2px"}}>
                <div onClick={()=>{console.log(props.id);monday.execute('openItemCard', { itemId: parseInt(props.id), boardId: parseInt(props.boardId) });}}>
                    <Text styles={descriptionTextStyles} title={props.name} nowrap block>{props.name}</Text>
                </div>
                { props.tags.length>0 && 
                    <div style={{width:'100%', padding: '4px 0px 0px', display:"flex"}}>
                        { props.tags.map((p)=>(
                            <span style={tagStyle} key={p}>{p}</span>
                        )) }
                    </div>
                }
                <div style={{padding: '12px 0px 0px', display:"flex"}}>
                    <Text styles={footerTextStyles} title="Time Est.">{props.estimate || " "}</Text>
                    <Text styles={footerTextStyles} title="Priority">{props.priority || " "}</Text>
                    <Stack.Item grow={1}>
                        <span />
                    </Stack.Item>
                    <Persona
                        text={props.owner}
                        title={props.owner}
                        size={8}
                        showInitialsUntilImageLoads={true}
                        hidePersonaDetails={true}
                        imageUrl= {imageUrl}
                    />
                </div>
            </div>
        </div>
        )}
        </Draggable>
  );
};
const ItemColumn = (props) => {
    const droppableId = props.status.id + " " + props.groupTitle;
    return (
        <div style={{flex:1, width:0, margin: "0 4px"}}>
            <Text styles={labelStyles} nowrap block>{props.status.text || " "}</Text>
            <Droppable droppableId={droppableId}>
            {(provided, snapshot)=>(
                <div
                ref={provided.innerRef}
                style={{...getDroppableStyle(snapshot.isDraggingOver), height:"calc(100% - 46px)"}}
                {...provided.droppableProps}
                >
                {
                    props.items.map((t)=>
                        <ItemCard {...t}
                            key={t.id}
                            userData={props.userData}
                            boardId={props.boardId}
                        />
                    )
                }
                {provided.placeholder}
                </div>
                )}
            </Droppable>
        </div>
    );
}

const GroupData = (props) => {
    return(
        <div>
            <div style={headerStyle}>{props.title}</div>
            <div style={{display:"flex"}}>
            {
                props.statusList.map((v)=>(
                    <ItemColumn
                        status={v}
                        groupTitle={props.id}
                        items={props.items.map((mi, index)=>({...mi, "index":index})).filter((it)=>it.status === v.text)}
                        key={v.id}
                        userData={props.userData}
                        boardId={props.boardId}
                    />
                ))
            }
            </div>
        </div>
    );
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.componentRef = React.createRef();

        // Default state
        this.state = {
            settings: {},
            name: "",
        };
    }

    updateGroupItems=(boardData)=> {
        const groupItems = boardData.boards[0].groups.map((b)=>({
            "id": b.id,
            "title": b.title,
            "items": boardData.boards[0].items.filter((v=>(v.group.id === b.id))).map((val)=>({
                "id": val.id,
                "name": val.name,
                "priority": val.column_values.filter((cval)=>(cval.title === "Priority"))[0].text,
                "status": val.column_values.filter((cval)=>(cval.title === "Status"))[0].text,
                "owner": val.column_values.filter((cval)=>(cval.title === "Owner"))[0].text,
                "estimate": Number(val.column_values.filter((cval)=>(cval.title === "Time Est."))[0].text),
                "tags": val.column_values.filter((cval)=>(cval.title === "Tags"))[0].text.split(", ").filter((t)=>t.length>0),
            })),
        }));
        this.setState({groupItems: groupItems});
        console.log(groupItems);
    }
    
    updateStatusLabels=(boardData)=>{
        const statusJson = JSON.parse(boardData.boards[0].columns.filter((v=>(v.title==="Status")))[0].settings_str);
        const statusList = Object.keys(statusJson.labels).map((s)=>({"id": s, "text": statusJson.labels[s], "pos": statusJson.labels_positions_v2[s]})).concat({"id":"-1","text":null, "pos":-1}).sort((a,b)=>a.pos-b.pos);
        this.setState({statusList: statusList});
    }

    componentDidMount() {
        initializeIcons();
        monday.listen("settings", res => {
            this.setState({ settings: res.data });
            window.addEventListener('resize', this.updateWindowDimensions);
        });

        monday.listen("context", res => {
            this.setState({context: res.data});
            console.log(res.data);
            monday.api(`query ($boardIds: [Int]) { boards (ids:$boardIds) { name id items {name id group { id } column_values { title text } } top_group { id title }  groups { id title } columns {title settings_str} } }`,
                       { variables: {boardIds: this.state.context.boardIds} }
                      )
                .then(res => {
                this.setState({boardData: res.data});
                this.updateGroupItems(res.data);
                console.log(res.data);
                this.updateStatusLabels(res.data);
            });
            monday.api(`query  { users { name photo_thumb_small} }`)
                .then(res => {
                this.setState({userData: res.data.users.reduce(function(acc,val){acc[val.name] = val.photo_thumb_small; return acc},{})});
            });
        })

    }
    onDragEnd = (ev) =>{
        const { destination, source, draggableId } = ev;
        if(!destination) return;
        if(
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        )
        return;
        console.log(ev);
        const dStatusId = parseInt(destination.droppableId).toString();
        const dGroupId = destination.droppableId.substring(dStatusId.length+1);
        const sStatusId = parseInt(source.droppableId).toString();
        const sGroupId = source.droppableId.substring(sStatusId.length+1);
        const groupItems = this.state.groupItems;
        const dStatusLabel = this.state.statusList.filter((s)=>s.id===dStatusId)[0].text; 
        const dGroupItem = groupItems.filter((g)=>g.id === sGroupId)[0].items.splice(source.index, 1)[0];
        dGroupItem.status = dStatusLabel;
        groupItems.filter((g)=>g.id === dGroupId)[0].items.splice(destination.index, 0, dGroupItem);
        this.setState({groupItems: groupItems});
        /*
        monday.api(`query ($itemIds: [Int]) { items (ids:$itemIds) { name id } }`,
                   { variables: {itemId: [parseInt(draggableId)]} }
                  )
            .then(res => {
            console.log(res.data);
        });
        */
        
        if(sGroupId !== dGroupId) {
            monday.api(`mutation ($itemId: Int, $groupId: String!) { move_item_to_group (item_id:$itemId, group_id:$groupId) {id}}`,
                   {variables:{itemId: parseInt(draggableId), groupId: dGroupId}}).then(res=>{console.log(res)});
        }
        console.log(this.state.boardData.boards[0].id);
        if(sStatusId !== dStatusId) {
            const valueString = `"{\\"label\\": ${dStatusLabel?`\\"${dStatusLabel}\\"`:"null"}}"`;
            console.log(valueString);
            /*
        monday.api(`mutation ($boardId: Int!, $itemId: Int, $valueString: JSON!) {change_column_value (board_id: $boardId, item_id: $itemId, column_id: "status", value: $valueString) {id}}`,
                   {variables:{boardId: parseInt(this.state.boardData.boards[0].id), itemId: parseInt(draggableId), valueString: valueString}}).then(res=>{console.log(res)});
                   */
            const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                    id
                }
            }`;
            const boardId = parseInt(this.state.boardData.boards[0].id);
            const columnId = "status";
            const itemId = parseInt(draggableId);
            const value = `{\\"label\\": ${dStatusLabel?`\\"${dStatusLabel}\\"`:"null"}}`;
            
            const variables = { boardId, columnId, itemId, value };

            monday.api(query, { variables }).then(res=>{console.log(res)});
        }
        
        
    }

    render() {
        return (
            <div
                className="App"
            >
            <DragDropContext onDragEnd={this.onDragEnd}>
                <div>
                { this.state.groupItems && this.state.statusList && this.state.groupItems.map((g)=>(
                        <GroupData {...g}
                            key={g.id}
                            statusList={this.state.statusList}
                            userData={this.state.userData}
                            boardId={this.state.boardData.boards[0].id}
                        />
                    ))
                }
                </div>
            </DragDropContext>
            </div>
        );
    }
}

export default App;
