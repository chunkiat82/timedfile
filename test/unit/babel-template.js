import babelTemplate from '../../src/babel-template';

describe('babelTemplate', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(babelTemplate, 'greet');
      babelTemplate.greet();
    });

    it('should have been run once', () => {
      expect(babelTemplate.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(babelTemplate.greet).to.have.always.returned('hello');
    });
  });
});
