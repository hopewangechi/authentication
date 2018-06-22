import React from 'react'
import BasicModal from '../components/BasicModal.js'
import * as firebase from 'firebase'
import * as queryString from 'query-string'
import ProgressModal from '../components/ProgressModal.js'
import EditorToolbar from '../components/EditorToolbar.js'
import EditorForm from '../components/EditorForm.js'

export default class Editor extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            savingModal: false,
            errorModal: false,
            cancelModal: false,
            errors: []
        }
        this.getEditorInfo = this
            .getEditorInfo
            .bind(this)
    }

    getEditorInfo() {
        var query = queryString.parse(window.location.search)
        var action = query.action
        var category = query.category
        if (!action || !category) 
            return null
        switch (action) {
            case 'new':
                return {action: action, category: category, parent: query.parent}
            case 'edit':
                var path = query.path
                if (!path) 
                    return null
                return {action: action, category: category, path: path, parent: query.parent}
            default:
                return null
        }
    }

    save() {
        var errors;
        // eslint-disable-next-line
        if ((errors = this.form.validate()) && errors.length > 0)
            this.setState({errorModal: true, errors: errors})
        else {
            this.setState({savingModal: true})
            this.form.collect().then(x => {
                var info = this.getEditorInfo()
            
                // eslint-disable-next-line
                if (info.category.indexOf('appearance') >= 0)
                    setTimeout(() => {
                        firebase.database().ref(`/appearance/${info.parent}/`).update(x, null).then(() => {
                            this.closeEditor(true)
                        }, e => {
                            alert(e)
                        this.closeEditor(false)
                        })
                    }, 50)
                else if (info.category.indexOf('elements') === -1)
                    setTimeout(() => {
                        firebase.database().ref(`/${info.category}/${x.id}/`)[info.path ? 'update' : 'set'](x, null).then(() => {
                            this.closeEditor(true)
                        }, e => {
                            alert(e)
                        this.closeEditor(false)
                        })
                    }, 50)
                else
                    setTimeout(() => {
                        firebase.database().ref(`/tabs/${info.parent}/`).once('value').then(snap => {
                            setTimeout(() => {
                                var tab = snap.val()
                                if (!tab.elements)
                                    tab.elements = []
                                var i;
                                // eslint-disable-next-line
                                if ((i = tab.elements.map(v => v.id).indexOf(x.id)) === -1)
                                    tab.elements.push(x)
                                else
                                    tab.elements[i] = x
                                firebase.database().ref(`/tabs/${info.parent}/`).update(tab).then(() => {
                                    this.closeEditor(true)
                                }, e => {
                                    alert(e)
                                    this.closeEditor(false)
                                })
                            }, 50)
                        })
                    }, 50)
            })
        }
    }

    closeEditor(reload) {
        if (window.opener) {
            if (reload)
                window.opener.location.reload()
            window.close()
        } else 
            window.location.href = '/'
    }

    render() {
        var info = this.getEditorInfo()
        if (!info) 
            return <BasicModal isOpen={true} onPrimary={this.closeEditor.bind(this, false)} primary="Close" header="Invalid Request" body="ERROR: The request is invalid."/>
        else
            return <div>
                <EditorToolbar onSave={this.save.bind(this)} onCancel={() => this.setState({cancelModal: true})}/>
                <EditorForm ref={f => this.form = f}/>
                <BasicModal toggle={() => this.setState({
                        cancelModal: !this.state.cancelModal
                    })} isOpen={this.state.cancelModal} header="Unsaved Changes" body={<p>If you close this window, your changes will not be saved.<br/>Are you sure you want to continue?</p>} primary="Discard Changes" primaryColor="danger" secondary="Go Back" onPrimary={this.closeEditor.bind(this, false)}/>
                    <ProgressModal isOpen={this.state.savingModal} progressColor="primary" progressText="Processing..."/>
                <BasicModal toggle={() => this.setState({errorModal: false, errors: []})} isOpen={this.state.errorModal} header="Validation Error" body={<div><p>Please resolve the following errors:<br/></p><ul>{(this.state.errors || []).map(e => <li key={e}>{e}</li>)}</ul></div>} primary="Dismiss" primaryColor="primary"/>
            </div>
    }
}