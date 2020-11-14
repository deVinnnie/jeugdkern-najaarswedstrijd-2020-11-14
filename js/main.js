window.onload = function()
{
    Presenter.init(
            {
                "thumbnail_width": 300,
                "ticker-position": "left",
                "scale": 0.95
            }
    );
    $("#splash").fadeOut();

  let sections = Array.from(document.getElementsByTagName("section"))
      .filter(s => !s.classList.contains("next_time"))
      .filter(s => !s.classList.contains("ronde"))
      .filter(s => s.id!="title_slide");

  // let csv = "";
  // sections.forEach(
  //   s => {
  //     let question = s.querySelector("p.question").textContent.trim();
  //     question = question.split("|")[1].trim();
  //     let type = "Multiple Choice";

  //     let answers = [];
  //     let correctAnswer = 0;

  //     if(s.querySelector("p.question").classList.contains("open")){
  //       type = "Fill-in-the-Blank";
  //       console.log(s.querySelector("p.question").dataset.answer);
  //       answers.push(s.querySelector("p.question").dataset.answer);
  //       correctAnswer = "";
  //     }
  //     else {
  //       answers = Array.from(s.querySelectorAll("ul li")).map(a => a.textContent);
  //       correctAnswer = answers.indexOf(s.querySelector("ul li.correct").textContent) + 1;
  //     }

  //     let padding = 5-answers.length;
  //     csv+= question+";" + type + ";"+
  //       answers.join(";")
  //       +";".repeat(padding)
  //       +";"+
  //       correctAnswer+"\n";
  //   }
  // );

  // console.log(csv);
    $(document).on("keydown", handleKey);

    showingAnswers = false;
  function handleKey(event){
    console.log("handle");
    console.log(showingAnswers);
        if(event.keyCode == 72){ //h
          $(".slideDeck").toggleClass("answers");

          if(showingAnswers){
            showingAnswers = false;
            Presenter.keyboard.enable();
            Presenter.mouse.enable();
          }
          else {
            showingAnswers = true;
            Presenter.keyboard.disable();
            Presenter.mouse.disable();
          }
        }
  }
    // setTimeout(function(){
    //     //Hide help after 6 seconds.
    //     $("#help").fadeOut();
    // },6000);
};
