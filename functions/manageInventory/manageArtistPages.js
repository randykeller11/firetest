const axios = require("axios");

exports.handler = async (_snap, _context, db) => {
  try {
    const albumPageData = _snap.data();
    const artistPageRef = await db
        .collection("artistPages")
        .doc(`${albumPageData.artistID}`)
        .get();

    const artistPageData = artistPageRef.data();
    const snapData = _snap.data();

    if (artistPageData) {
      await db
          .collection("artistPages")
          .doc(`${albumPageData.artistID}`)
          .set(
              {
                albums: {
                  ...artistPageData.albums,
                  [`${_snap.id}`]: snapData.dispEssentials,
                },
              },
              {merge: true},
          );
    } else {
      const key = "LotIRXAOnZgAeppKxkLP";
      const secret = "XouTbVNJTnYQKIsQZUoXFkocIuktXLoc";
      const headers = {
        headers: {
          Authorization: `Discogs key=${key}, secret=${secret}`,
        },
      };
      const url = `https://api.discogs.com/artists/${albumPageData.artistID}`;
      const response = await axios.get(url, headers);

      const targetImage = response.data.images.filter(
          (image) => image.type === "primary",
      );

      await db
          .collection("artistPages")
          .doc(`${albumPageData.artistID}`)
          .set({
            name_Search: response.data.name.toLowerCase(),
            name: response.data.name,
            image: targetImage[0].resource_url,
            albums: {[`${_snap.id}`]: snapData.dispEssentials},
          });
    }
  } catch (error) {
    console.log(error);
  }
};
