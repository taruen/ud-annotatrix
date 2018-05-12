'use strict'

const TABLE_COLUMNS_HEADERS = {'ID': 0, 'FORM': 1, 'LEMMA': 2, 'UPOSTAG': 3,
    'XPOSTAG': 4, 'FEATS': 5, 'HEAD': 6, 'DEPREL': 7, 'DEPS': 8, 'MISC': 9 };

var TABLE_COLUMNS_VISIBILITY = new Array(10).fill(true),
    IS_TABLE_VIEW = false,
    DEFAULT_NUM_TABLE_ROWS = 20

function calculateRows() {
    log.debug('called calculateRows()');

    const windowHeight = $(window).height(),
        graphDivHeight = $('.controls').outerHeight(),
        controlsDivHeight = $('.row').outerHeight(),
        remainingSpace = windowHeight - graphDivHeight - controlsDivHeight - 65;

    const fontSize = $('#indata').css('font-size'),
        lineHeight = Math.floor(parseInt(fontSize.replace('px','')) * 1.5);

    DEFAULT_NUM_TABLE_ROWS = parseInt(remainingSpace/lineHeight);
}

function fitTable() {
    log.debug('called fitTable()');

    calculateRows();

    /* If there're less lines in conllu than the default number of rows
    in the table, fit the number of rows to the number of lines. */
    const currentRows = $('#indata').val().split('\n').length;
    const numRows = (currentRows < DEFAULT_NUM_TABLE_ROWS
        ? currentRows + 1 : DEFAULT_NUM_TABLE_ROWS);

    $('#indata').attr('rows', numRows);
}


function tableEditCell(loc) {
    log.debug(`called tableEditCell(${loc})`);

    loc = loc.trim();
    const table = $('#indataTable'),
        cell = $(`${loc}`).html();

    log.debug(`tableEditCell() cell: ${cell}`);

    // Update the CoNLL-U and set the value in the textbox
    let conllu = '';
    $.each(table.rows, (i, row) => {
        $.each(row.cells, (j, cell) => {
            let thisCell = cell.children()[0].html();
            if (thisCell.trim() === '')
                thisCell = '_';
            thisCell = thisCell.replace(/<br>/g, ''); // Get rid of extra spaces

            conllu += (j > 0 ? '\t' : '') + thisCell;
        });
        conllu += '\n';
    });

    log.debug(`tableEditCell() conllu: ${conllu}`);

    $('#indata').val(conllu);
    drawTree();
}

function toggleTableView() {
    log.debug('called toggleTableView()');

    // This function toggles the table view
    $('#tableViewButton').toggleClass('fa-code', 'fa-table');
    $('#indata').toggle();
    $('#indataTable').toggle();

    IS_TABLE_VIEW = !IS_TABLE_VIEW;
}

function updateTable() {
    log.debug('called updateTable()');

    // Update the data in the table from the data in the textarea
    $('#indataTable tbody').empty();
    $.each($('#indata').val().split('\n'), (i, line) => {
        log.debug(`updateTable() line: ${line}`);
        if (line.trim() === '')
            return

        if (line[0] === '#') {
            $('#indataTable tbody').append(`<tr style="display:none;" id="table_${i}"><td colspan="10"><span>${line}</span></td></tr>`);
        } else if (line.split('\t').length !== 10) {
            log.debug(`updateTable() weirdness!`);
            $('#indataTable tbody').append(`<tr style="display:none;" id="table_${i}"><td colspan="10"><span>${line}</span></td></tr>`);
        } else {

            let tr = $('<tr>'), // create a new <tr> node
                cells = line.split('\t');

            for (let j=0; j < 10; j++) {
                let valid = [true, '', {}],
                    loc = `table_${i}:${j}`;

                if (cells[j].trim() === '')
                    cells[j] = '_';

                if (cells[j] !== '_') {
                    if (j === 3)
                        valid = is_upos(cells[j]);
                    if (j === 7)
                        valid = is_udeprel(cells[j]);
                }

                let td = $('<td>').append( $('<span>')
                    .attr('id', loc)
                    .attr('data-value', cells[j])
                    .prop('contenteditable', true)
                    .blur(updateTable)
                    .keyup(() => { tableEditCell(loc); }) );

                if (!valid[0]) {
                    document.l10n.formatValue(valid[1], valid[2]).then( (t) => {
                      td.append( $('<span>').append('<i>')
                          .addClass('fa fa-exclamation-triangle')
                          .attr('aria-hidden', 'true')
                          .attr('title', t) );
                    });
                }
                tr.append(td);

                // Make sure hidden columns stay hidden
                if (!TABLE_COLUMNS_VISIBILITY[j])
                    $(`[id^=table_][id$=${j}]`).css('display', 'none');
            }

            $('#indataTable tbody').append(tr);
        }
    });

    /* Sushain's original, more beautiful code:
    $('#indataTable tbody').append(
        $('#indata').val().split('\n')
            .filter(line => line.length && !line.startsWith('#'))
            .map(rowText => $('<tr>').append(
                rowText.split('\t').map(cellText => $('<td>').text(cellText))
            ));
    ); */
}

function toggleTableColumn(col) {
    log.debug(`called toggleTableColumn(${col})`);

    // Toggle the visibility of a table column. It only hides the values in the cells,
    // not the column header.
    // @col = the column that was clicked

    // the HTML id of the table cell is #table_<ROW>:<COLUMN>, the hash maps
    // from column ID to column offset
    const colId = TABLE_COLUMNS_HEADERS[col],
        button = $(`#tableCol_${col}`).text();

    log.debug(`toggleTableColumn() colId: ${colId}, button: ${button}`);

    $(`#tableCol_${col} i`).toggleClass('fa-angle-double-right', 'fa-angle-double-left');
    $(`#tableHead_${col}`).toggle();
    $(`[id^=table_][id$=${colId}]`).toggle();

    TABLE_COLUMNS_VISIBILITY[colId] = !TABLE_COLUMNS_VISIBILITY[colId];

    if (button === '⚪') {  // If the column is currently hidden, make it visible
        /* $('#tableCol_' + col).append('⚫');
        $('#tableHead_' + col).css('display','inline-block');
        $('[id^=table_][id$=' + colId+']').css('display','inline-block');
        TABLE_COLUMNS_VISIBILITY[colId] = true; */
    } else { // If the column is visible make it hidden
        /* $('#tableCol_' + col).append('⚪');
        $('#tableHead_' + col).css('display','none');
        $('[id^=table_][id$=' + colId+']').css('display','none');
        TABLE_COLUMNS_VISIBILITY[colId] = false; */
    }

    // TODO: Maybe use greying out of the headers in addition to/instead of
    // the filled/empty dots to indicate hidden or not
}

function toggleCodeWindow() {
    log.debug(`called toggleCodeWindow()`);

    $('#codeVisibleButton').toggleClass('fa-chevron-down', 'fa-chevron-up');
    $('.indataarea').toggle();
    $('#tabBox').toggle();
    $('#viewButton').toggle();
    if (!IS_VERTICAL)
        $('#cy').css('height', $(window).height()-$('.inarea').height()-80);
}
