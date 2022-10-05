function Post() {
  const handleClick = () => {
    var stuff = ["haha", "hehe"];
    fetch("http://localhost:5000/values", {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },

      body: JSON.stringify({
        table: "vehicle_local_position",
        keys: ["x", "y"],
      }),
    })
      .then((res) => res.json())
      .then((res) => console.log(res));
  };
  return (
    <>
      <button onClick={handleClick}>Click me </button>
    </>
  );
}

export default Post;
