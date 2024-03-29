let accessToken;
const clientID = '0c85a97c546041c081fe6bbf04bdaf19';
const redirectURL = "http://localhost:3000/";

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        let expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        if (accessTokenMatch && expiresInMatch){
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            //Clears parameters and allows us to get a new token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else{
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURL}`;
            window.location = accessUrl;
        }
    },

    search(term){
        
        const accessToken = Spotify.getAccessToken();
       
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers:{ 
                Authorization: `Bearer ${accessToken}`          
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            } 

            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },
    savePlayList(name, trackURIs){
        if (!name || !trackURIs.length){
            return;
        }

        let accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}`};
        let userID;
        return fetch('https://api.spotify.com/v1/me', {headers : headers}).then(response => {
            return response.json();
        }).then(jsonResponse => {
            userID = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, 
            {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({ name: name })   
            }).then(response => {
                return response.json()
            }).then(jsonResponse => 
                {   
               const playlistID = jsonResponse.id; 
               return fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`, {
                headers: headers,
                method:'POST',
                body: JSON.stringify({uris : trackURIs})    
               });
            }); 
        });

    },

    checkPlayList(searchResults, currentPlayList){
        let results = searchResults;
        if (results.length !== 0) {
            for (let i = 0; i < currentPlayList.length; i++){
                for (let z = 0; z <results.length; z++){
                    if (currentPlayList[i].uri === results[z].uri){
                        results.splice(z,1);
                        break;
                    }
               
                }
                
                
            }
        }
        return results;

    }
}

export default Spotify;