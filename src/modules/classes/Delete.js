import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/storage'

export default class Delete {
    static tab(data) {
        var promises = [
            firebase
                .database()
                .ref(`${window.localStorage.getItem('db') === 'dev' ? '/dev' : ''}/tabs/${data.id}/`)
                .remove(),
            firebase
                .storage()
                .ref((window.localStorage.getItem('db') === 'dev' ? '/dev/' : '') + data.header.name)
                .delete()
        ]
        if (data.elements) 
            data
                .elements
                .filter(e => e.type === 'image')
                .forEach(e => promises.push(firebase.storage().ref(e.image.name).delete()))
        return Promise.all(promises)
    }

    static event(data) {
        var promises = [
            firebase
                .database()
                .ref(`${window.localStorage.getItem('db') === 'dev' ? '/dev' : ''}/events/${data.id}/`)
                .remove(),
            firebase
                .storage()
                .ref((window.localStorage.getItem('db') === 'dev' ? '/dev/' : '') + data.header.name)
                .delete()
        ]
        return Promise.all(promises)
    }

    static element(data, index, parent, parentCategory) {
        var updated = parent
        updated.elements[index] = null
        updated.elements = updated.elements.filter(o => Boolean(o))
        var promises = [
            firebase
                .database()
                .ref(`${window.localStorage.getItem('db') === 'dev' ? '/dev' : ''}/${parentCategory}/${updated.id}/`)
                .update(updated)
        ]
        if (data.type === 'image') 
            promises.push(firebase.storage().ref(data.image.name).delete())
        return Promise.all(promises)
    }
}