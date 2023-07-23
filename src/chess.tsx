import _ from "lodash"

export const Nothing = Symbol('nothing');
export type Nothing = typeof Nothing;
type Maybe<T> = T | Nothing;

export enum Color { WHITE, BLACK }

export type Coord = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export enum Piece { PAWN, ROOK, KNIGHT, BISHOP, QUEEN, KING }

export type Position = [Coord, Coord]

type DeltaPosition = [number, number]

export type PieceOnBoard = {
    pos: Position,
    color: Color,
    piece: Piece
}

export const pieceOnBoard = (pos: Position, piece: Piece, color: Color): PieceOnBoard => ({ pos, color, piece })

export type Board = Array<PieceOnBoard>

type EnPassantPossibility = {
    pos: Position,
    piece: PieceOnBoard
}

export type Game = {
    current_player: Color,
    board: Board,
    castling_not_possible: Color[],
    en_passant_possible_for: Maybe<EnPassantPossibility>
}

type SelectedState = {
    selected_piece: PieceOnBoard,
    potential_moves: Position[],
    potential_fights: Position[]
}

const next_player = {
    [Color.WHITE]: Color.BLACK,
    [Color.BLACK]: Color.WHITE
}

export type SelectedGame = Game & SelectedState

const initial_board: Board = [
    pieceOnBoard([1, 1], Piece.ROOK, Color.WHITE),
    pieceOnBoard([2, 1], Piece.KNIGHT, Color.WHITE),
    pieceOnBoard([3, 1], Piece.BISHOP, Color.WHITE),
    pieceOnBoard([4, 1], Piece.QUEEN, Color.WHITE),
    pieceOnBoard([5, 1], Piece.KING, Color.WHITE),
    pieceOnBoard([6, 1], Piece.BISHOP, Color.WHITE),
    pieceOnBoard([7, 1], Piece.KNIGHT, Color.WHITE),
    pieceOnBoard([8, 1], Piece.ROOK, Color.WHITE),

    pieceOnBoard([1, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([2, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([3, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([4, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([5, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([6, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([7, 2], Piece.PAWN, Color.WHITE),
    pieceOnBoard([8, 2], Piece.PAWN, Color.WHITE),

    pieceOnBoard([1, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([2, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([3, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([4, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([5, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([6, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([7, 7], Piece.PAWN, Color.BLACK),
    pieceOnBoard([8, 7], Piece.PAWN, Color.BLACK),

    pieceOnBoard([1, 8], Piece.ROOK, Color.BLACK),
    pieceOnBoard([2, 8], Piece.KNIGHT, Color.BLACK),
    pieceOnBoard([3, 8], Piece.BISHOP, Color.BLACK),
    pieceOnBoard([4, 8], Piece.QUEEN, Color.BLACK),
    pieceOnBoard([5, 8], Piece.KING, Color.BLACK),
    pieceOnBoard([6, 8], Piece.BISHOP, Color.BLACK),
    pieceOnBoard([7, 8], Piece.KNIGHT, Color.BLACK),
    pieceOnBoard([8, 8], Piece.ROOK, Color.BLACK)
]

type DeltaPath = Array<DeltaPosition>

type Path = Array<Position>
type Paths = Array<Path>


type Diag = (i: number) => DeltaPosition
const diag1: Diag = (i) => [i, i]
const diag2: Diag = (i) => [-i, i]
const diag3: Diag = (i) => [i, -i]
const diag4: Diag = (i) => [-i, -i]

const ort1: Diag = (i) => [0, i]
const ort2: Diag = (i) => [0, -i]
const ort3: Diag = (i) => [i, 0]
const ort4: Diag = (i) => [-i, 0]

const diagonals = [diag1, diag2, diag3, diag4]
const orthagonals = [ort1, ort2, ort3, ort4]
const all_directions = [...orthagonals, ...diagonals]

const full_board_range = (it: Diag) => _.range(1, 7).map(it)
const one_field_range = (it: Diag) => [1].map(it)

const moves: Record<Piece, Array<DeltaPath>> = {
    [Piece.PAWN]: [[[0, 1]]],
    [Piece.BISHOP]: diagonals.map(full_board_range),
    [Piece.KING]: all_directions.map(one_field_range),
    [Piece.KNIGHT]: [
        [[1, 2]], [[2, 1]],
        [[-1, 2]], [[-2, 1]],
        [[1, -2]], [[2, -1]],
        [[-1, -2]], [[-2, -1]]],
    [Piece.QUEEN]: all_directions.map(full_board_range),
    [Piece.ROOK]: orthagonals.map(full_board_range)
}

const castling_paths = (board: Board, piece: PieceOnBoard): Array<DeltaPath> => {
    let { color, pos } = piece,
        paths:Array<DeltaPath> = [],
        row = pos[1]
    if (_.isEqual(pieceAt(board, [8, row]), pieceOnBoard([8, row], Piece.ROOK, color))
        && pieceAt(board, [7, row]) === Nothing
        && pieceAt(board, [6, row]) === Nothing)
        paths.push([[0, 0], [1, 0], [2, 0]])
    if (_.isEqual(pieceAt(board, [1, row]), pieceOnBoard([1, row], Piece.ROOK, color))
        && pieceAt(board, [3, row]) === Nothing
        && pieceAt(board, [4, row]) === Nothing)
        paths.push([[0, 0], [-1, 0], [-2, 0]])
    return paths
}

const fights: Record<Piece, Array<DeltaPath>> = {
    ...moves,
    [Piece.PAWN]: [[[-1, 1], [1, 1]]]
}

const apply = (pos: Position, delta: DeltaPosition): [number, number] => {
    let x = pos[0] + delta[0],
        y = pos[1] + delta[1]
    return [x, y]
}

const apply_delta_to_paths = (pos: Position, paths: Array<DeltaPath>): Paths =>
    paths.map(path => path.map(delta => apply(pos, delta))
        .filter((pos): pos is Position => !(pos[0] < 1 || pos[0] > 8 || pos[1] < 1 || pos[1] > 8)))

const black_pawn_reverse = (piece: PieceOnBoard) => (path: DeltaPath): DeltaPath =>
    (piece.color === Color.BLACK && piece.piece === Piece.PAWN)
        ? path.map(pos => [pos[0], -pos[1]])
        : path

const at_init_position = (piece: PieceOnBoard) =>
    _.isEqual(pieceAt(initial_board, piece.pos), piece)

const pawn_init_jump = (piece: PieceOnBoard) => (path: DeltaPath): DeltaPath =>
    (piece.piece === Piece.PAWN && at_init_position(piece))
        ? [...path, [0, 2]]
        : path

const is_position = (it: Position | undefined): it is Position => !!it


const isAttacked = (game: Game, selected_piece: PieceOnBoard, path: Path) => {
    let opponents_board = game.board.filter(({ color }) => color !== selected_piece.color),
        attacked_positions = opponents_board.flatMap(piece => moves_for(game.board, piece))
    return !_.isEmpty(_.intersectionWith(path, attacked_positions, _.isEqual))
}

const castling = (game: Game, selected_piece: PieceOnBoard): Position[] =>
    selected_piece.piece === Piece.KING && !game.castling_not_possible.includes(selected_piece.color)
        ? apply_delta_to_paths(selected_piece.pos, castling_paths(game.board, selected_piece))
            .filter(path => !isAttacked(game, selected_piece, path))
            .flatMap(it => it)
        : []

const moves_for = (board: Board, selected_piece: PieceOnBoard): Position[] => {
    let deltas = moves[selected_piece.piece]
        .map(pawn_init_jump(selected_piece))
        .map(black_pawn_reverse(selected_piece)),
        potential_paths: Paths = apply_delta_to_paths(selected_piece.pos, deltas),
        is_legal_move = (pos: Position) => Nothing === pieceAt(board, pos)
    return potential_paths.flatMap(path => _.takeWhile(path, is_legal_move))
}

const is_en_passant = (en_passant: Maybe<EnPassantPossibility>, pos: Position): boolean =>
    en_passant !== Nothing && _.isEqual(en_passant.pos, pos)

const fights_for = (game: Game, selected_piece: PieceOnBoard): Position[] => {
    let { board } = game,
        potential_paths: Paths = apply_delta_to_paths(selected_piece.pos, fights[selected_piece.piece]),
        en_passant = (pos: Position) => is_en_passant(game.en_passant_possible_for, pos),
        is_piece = (pos: Position) => Nothing !== pieceAt(board, pos) || en_passant(pos),
        first_piece_on_path = (path: Path) => _.find(path, is_piece),
        opponents_board = board.filter(({ color }) => color !== selected_piece.color),
        is_opponent_piece = (pos: Position) => pieceAt(opponents_board, pos) !== Nothing || en_passant(pos)
    return potential_paths
        .map(first_piece_on_path)
        .filter(is_position)
        .filter(is_opponent_piece)
}

export const initial_game: Game = {
    current_player: Color.WHITE,
    board: initial_board,
    castling_not_possible: [],
    en_passant_possible_for: Nothing
}

export const pieceAt = (board: Board, position: Position): Maybe<PieceOnBoard> =>
    board.find(({ pos }) => _.isEqual(pos, position)) || Nothing

export const select_piece = (game: Game, pos: Position): SelectedGame | Game => {
    let selected_piece = pieceAt(game.board, pos)
    if (selected_piece === Nothing) return game
    return {
        ...game,
        selected_piece,
        potential_moves: [...moves_for(game.board, selected_piece), ...castling(game, selected_piece)],
        potential_fights: fights_for(game, selected_piece)
    }
}

const en_passant_move = (piece: PieceOnBoard, move: Position, en_passant_possible_for: Maybe<EnPassantPossibility>) =>
    en_passant_possible_for !== Nothing
    && _.isEqual(piece, en_passant_possible_for.piece)
    && _.isEqual(move, en_passant_possible_for.pos)


type CastlingDesc = { move: Position, remove: Array<Position>, add: Array<PieceOnBoard> }
const castling_desc = (move: Position, remove: Array<Position>, add: Array<PieceOnBoard>): CastlingDesc =>
    ({ move, remove, add })

const castlings = [
    castling_desc([7, 8],
        [[8, 8], [5, 8]],
        [
            pieceOnBoard([7, 8], Piece.KING, Color.BLACK),
            pieceOnBoard([6, 8], Piece.ROOK, Color.BLACK)
        ]),
    castling_desc([3, 8],
        [[1, 8], [5, 8]],
        [
            pieceOnBoard([3, 8], Piece.KING, Color.BLACK),
            pieceOnBoard([4, 8], Piece.ROOK, Color.BLACK)
        ]),

    castling_desc([7, 1],
        [[8, 1], [5, 1]],
        [
            pieceOnBoard([7, 1], Piece.KING, Color.WHITE),
            pieceOnBoard([6, 1], Piece.ROOK, Color.WHITE)
        ]),
    castling_desc([3, 1],
        [[1, 1], [5, 1]],
        [
            pieceOnBoard([3, 1], Piece.KING, Color.WHITE),
            pieceOnBoard([4, 1], Piece.ROOK, Color.WHITE)
        ])
]

const performe_castling = (board: Board, pos: Position): Board => {
    let { remove, add } = castlings.find(({ move }) => _.isEqual(move, pos)) as CastlingDesc
    return board.filter(({ pos }) => remove.includes(pos)).concat(add)
}

export const move = (game: SelectedGame, pos: Position): Game => {
    let { current_player, board, selected_piece, en_passant_possible_for } = game,
        new_piece_to_put = pieceOnBoard(pos, selected_piece.piece, selected_piece.color),
        is_move_castling = selected_piece.piece === Piece.KING && Math.abs(pos[0] - selected_piece.pos[0]) === 2,
        move_piece = (piece: PieceOnBoard) => (_.isEqual(piece.pos, selected_piece.pos))
            ? new_piece_to_put
            : piece,
        remove_taken = (piece: PieceOnBoard) => !_.isEqual(piece.pos, pos) && !en_passant_move(piece, pos, en_passant_possible_for),
        castling_not_possible = _.uniq([...game.castling_not_possible, ...(selected_piece.piece === Piece.KING ? [selected_piece.color] : [])])
    return {
        current_player: next_player[current_player],
        board: is_move_castling
            ? performe_castling(board, pos)
            : board.filter(remove_taken).map(move_piece),
        castling_not_possible,
        en_passant_possible_for: (selected_piece.piece === Piece.PAWN && Math.abs(pos[1] - selected_piece.pos[1]) === 2)
            ? {
                pos: [selected_piece.pos[0], selected_piece.pos[1] + (selected_piece.color === Color.WHITE ? 1 : -1)] as Position,
                piece: new_piece_to_put
            }
            : Nothing
    }
}
