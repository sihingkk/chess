import { select_piece, initial_game, pieceAt, Piece, Color, Nothing, pieceOnBoard, Game, Board, SelectedGame, move } from "./chess"


const init_game = (board: Board, current_player: Color): Game =>
    ({ current_player, board, castling_not_possible: [], en_passant_possible_for: Nothing })


test('trying to select not existing piece', () => {
    expect(select_piece(initial_game, [3, 3])).toBe(initial_game);
});

test('selecting a pawn', () => {
    let game = select_piece(initial_game, [3, 2]) as SelectedGame
    expect(game.selected_piece).toStrictEqual(pieceOnBoard([3, 2], Piece.PAWN, Color.WHITE));
    expect(game.potential_moves).toStrictEqual([[3, 3], [3, 4]]);
});

test('partially blocked pawn path', () => {
    let board: Board = [
        pieceOnBoard([3, 2], Piece.PAWN, Color.WHITE),
        pieceOnBoard([3, 4], Piece.PAWN, Color.WHITE)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [3, 2]) as SelectedGame
    expect(game.potential_moves).toStrictEqual([[3, 3]]);
});

test('fully blocked pawn path', () => {
    let board: Board = [
        pieceOnBoard([3, 2], Piece.PAWN, Color.WHITE),
        pieceOnBoard([3, 3], Piece.PAWN, Color.WHITE)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [3, 2]) as SelectedGame
    expect(game.potential_moves).toStrictEqual([]);
});

test('partially blocked bishop path', () => {
    let board: Board = [
        pieceOnBoard([3, 3], Piece.BISHOP, Color.WHITE),
        pieceOnBoard([5, 5], Piece.PAWN, Color.WHITE)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [3, 3]) as SelectedGame;
    expect(game.potential_moves).toStrictEqual([[4, 4], [2, 4], [1, 5], [4, 2], [5, 1], [2, 2], [1, 1]]);
});

test('rook can beat only first figure in the path', () => {
    let board: Board = [
        pieceOnBoard([1, 1], Piece.ROOK, Color.WHITE),
        pieceOnBoard([1, 3], Piece.PAWN, Color.BLACK),
        pieceOnBoard([1, 4], Piece.PAWN, Color.BLACK)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [1, 1]) as SelectedGame
    expect(game.potential_fights).toStrictEqual([[1, 3]]);
});

test('rook can not beat they own color', () => {
    let board: Board = [
        pieceOnBoard([1, 1], Piece.ROOK, Color.WHITE),
        pieceOnBoard([1, 3], Piece.PAWN, Color.WHITE),
        pieceOnBoard([1, 4], Piece.PAWN, Color.BLACK)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [1, 1]) as SelectedGame
    expect(game.potential_fights).toStrictEqual([]);
});

test('fights for a pawn', () => {
    let board: Board = [pieceOnBoard([2, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([3, 3], Piece.PAWN, Color.BLACK)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [2, 2]) as SelectedGame
    expect(game.potential_fights).toStrictEqual([[3, 3]]);
});

test('black pawn moves backwards', () => {
    let board: Board = [pieceOnBoard([1, 7], Piece.PAWN, Color.BLACK)],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [1, 7]) as SelectedGame
    expect(game.potential_moves).toStrictEqual([[1, 6], [1, 5]]);
})

test('castling one tower on left', () => {
    let board: Board = [
        pieceOnBoard([1, 8], Piece.ROOK, Color.BLACK),
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [5, 8]) as SelectedGame
    expect(game.potential_moves).toContainEqual([3, 8]);
    expect(game.potential_moves).not.toContainEqual([7, 8]);
})

test('castling one tower on right', () => {
    let board: Board = [
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([8, 8], Piece.ROOK, Color.BLACK),
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [5, 8]) as SelectedGame
    expect(game.potential_moves).not.toContainEqual([3, 8]);
    expect(game.potential_moves).toContainEqual([7, 8]);
})

test('castling both towers', () => {
    let board: Board = [
        pieceOnBoard([1, 8], Piece.ROOK, Color.BLACK),
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([8, 8], Piece.ROOK, Color.BLACK),
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [5, 8]) as SelectedGame
    expect(game.potential_moves).toContainEqual([3, 8]);
    expect(game.potential_moves).toContainEqual([7, 8]);
})

test('castling is not possible when king attacked on the way', () => {
    let board: Board = [
        pieceOnBoard([1, 8], Piece.ROOK, Color.BLACK),
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([4, 8], Piece.ROOK, Color.WHITE),
        pieceOnBoard([8, 8], Piece.ROOK, Color.BLACK),
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [5, 8]) as SelectedGame
    expect(game.potential_moves).not.toContainEqual([3, 8]);
    expect(game.potential_moves).toContainEqual([7, 8]);
})

test('moving a piece', () => {
    let game = select_piece(initial_game, [3, 2]) as SelectedGame
    expect(game.selected_piece).toStrictEqual(pieceOnBoard([3, 2], Piece.PAWN, Color.WHITE));
    expect(game.potential_moves).toStrictEqual([[3, 3], [3, 4]]);

    let after_move = move(game, [3, 3])
    expect(pieceAt(after_move.board, [3, 3])).toStrictEqual(pieceOnBoard([3, 3], Piece.PAWN, Color.WHITE))
})

test('moving a king prevents castling', () => {
    let board: Board = [
        pieceOnBoard([1, 8], Piece.ROOK, Color.BLACK),
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([1, 1], Piece.KING, Color.WHITE),
    ],
        init = init_game(board, Color.BLACK),
        step_1 = select_piece(init, [5, 8]) as SelectedGame,
        step_2 = move(step_1, [5, 7]),
        step_3 = select_piece(step_2, [1, 1]) as SelectedGame,
        step_4 = move(step_3, [2, 2]),
        step_5 = select_piece(step_4, [5, 7]) as SelectedGame
    expect(step_5.potential_moves).not.toContainEqual([3, 7]);
    expect(step_5.potential_moves).not.toContainEqual([3, 8]);
    expect(step_5.potential_moves).not.toContainEqual([7, 7]);
    expect(step_5.potential_moves).not.toContainEqual([7, 8]);
})

test('pawn captures', () => {
    let board: Board = [
        pieceOnBoard([2, 2], Piece.PAWN, Color.WHITE),
        pieceOnBoard([3, 3], Piece.PAWN, Color.BLACK)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [2, 2]) as SelectedGame
    expect(game.potential_fights).toStrictEqual([[3, 3]]);
    let step_1 = move(game, [3, 3])
    expect(step_1.board).toStrictEqual([pieceOnBoard([3, 3], Piece.PAWN, Color.WHITE)])
})

test('pawns en passant - white captures', () => {
    let board: Board = [
        pieceOnBoard([1, 7], Piece.PAWN, Color.BLACK),
        pieceOnBoard([2, 5], Piece.PAWN, Color.WHITE),
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [1, 7]) as SelectedGame,
        step_1 = move(game, [1, 5]),
        step_2 = select_piece(step_1, [2, 5]) as SelectedGame
    expect(step_2.potential_fights).toContainEqual([1, 6])
    let step_3 = move(step_2, [1, 6])
    expect(step_3.board).toStrictEqual([pieceOnBoard([1, 6], Piece.PAWN, Color.WHITE)])
})

test('pawns en passant - black captures', () => {
    let board: Board = [
        pieceOnBoard([1, 2], Piece.PAWN, Color.WHITE),
        pieceOnBoard([2, 4], Piece.PAWN, Color.BLACK),
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [1, 2]) as SelectedGame,
        step_1 = move(game, [1, 4]),
        step_2 = select_piece(step_1, [2, 4]) as SelectedGame,
        step_3 = move(step_2, [1, 3])
    expect(step_3.board).toStrictEqual([pieceOnBoard([1, 3], Piece.PAWN, Color.BLACK)])
})

test('castling short - black', () => {
    let board: Board = [
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([8, 8], Piece.ROOK, Color.BLACK)
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [5, 8]) as SelectedGame,
        step_1 = move(game, [7, 8])
    expect(step_1.board).toStrictEqual([
        pieceOnBoard([7, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([6, 8], Piece.ROOK, Color.BLACK)])
})


test('castling long - black', () => {
    let board: Board = [
        pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([1, 8], Piece.ROOK, Color.BLACK)
    ],
        init = init_game(board, Color.BLACK),
        game = select_piece(init, [5, 8]) as SelectedGame,
        step_1 = move(game, [3, 8])
    expect(step_1.board).toStrictEqual([
        pieceOnBoard([3, 8], Piece.KING, Color.BLACK),
        pieceOnBoard([4, 8], Piece.ROOK, Color.BLACK)
    ])
})


test('castling short - white', () => {
    let board: Board = [
        pieceOnBoard([5, 1], Piece.KING, Color.WHITE),
        pieceOnBoard([8, 1], Piece.ROOK, Color.WHITE)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [5, 1]) as SelectedGame,
        step_1 = move(game, [7, 1])
    expect(step_1.board).toStrictEqual([
        pieceOnBoard([7, 1], Piece.KING, Color.WHITE),
        pieceOnBoard([6, 1], Piece.ROOK, Color.WHITE)])
})


test('castling long - white', () => {
    let board: Board = [
        pieceOnBoard([5, 1], Piece.KING, Color.WHITE),
        pieceOnBoard([1, 1], Piece.ROOK, Color.WHITE)
    ],
        init = init_game(board, Color.WHITE),
        game = select_piece(init, [5, 1]) as SelectedGame,
        step_1 = move(game, [3, 1])
    expect(step_1.board).toStrictEqual([
        pieceOnBoard([3, 1], Piece.KING, Color.WHITE),
        pieceOnBoard([4, 1], Piece.ROOK, Color.WHITE)
    ])
})
