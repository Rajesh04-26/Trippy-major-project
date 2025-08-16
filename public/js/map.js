mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
        container: 'map', 
        style: 'mapbox://styles/mapbox/standard',
        center: listing.geometry.coordinates, 
        zoom: 8, 
});

const marker = new mapboxgl.Marker({ color: 'red' })
        .setLngLat(listing.geometry.coordinates)
        .setPopup(new mapboxgl.Popup({offset: 25})
        .setHTML(`<h5>${listing.location}</h5>
            <p>Exact location will be provided after booking!<p>`)
        .setMaxWidth("300px"))
        .addTo(map);