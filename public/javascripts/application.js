(function() {
  $('.destroy').live('click', function(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to delete that item?')) {
      var element = $(this),
          form = $('<form></form>');
      form
        .attr({
          method: 'POST',
          action: element.attr('href')
        })
        .hide()
        .append('<input type="hidden" />')
        .find('input')
        .attr({
          'name': '_method',
          'value': 'delete'
        })
        .end()
        .appendTo($('body'))
        .submit();
    }
  });

  $("body").bind("click", function (e) {
    $('.dropdown-toggle, .menu').parent("li").removeClass("open");
  });
  $(".dropdown-toggle, .menu").click(function (e) {
    var $li = $(this).parent("li").toggleClass('open');
    return false;
  });

  $('#document-list li a').live('click', function(e) {
    var li = $(this);

    $.get(this.href + '.json', function(data) {
      $('#document-list .selected').removeClass('selected');
      li.addClass('selected');
      $('#editor').val(data.data);
      $('#editor').focus();
    });

    e.preventDefault();
  });

})();